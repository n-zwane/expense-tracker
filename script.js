let categoryChart;

document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const transactionForm = document.getElementById("transaction-form");
    const descriptionInput = document.getElementById("description");
    const amountInput = document.getElementById("amount");
    const dateInput = document.getElementById("date");
    const categoryInput = document.getElementById("category");
    const typeInputs = document.querySelectorAll('input[name="type"]');
    const transactionsList = document.getElementById("transactions-list");
    const balanceAmount = document.getElementById("balance-amount");
    const incomeAmount = document.getElementById("income-amount");
    const expenseAmount = document.getElementById("expense-amount");
    const searchInput = document.getElementById("search");
    const filterCategory = document.getElementById("filter-category");
    const themeToggle = document.getElementById("toggle_checkbox");
    const monthlyChartCtx = document.getElementById("monthlyChart");
    let monthlyChart;

    // Initialize transactions array from local storage
    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    // Initialize app
    init();

    // Form submission
    transactionForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const date = dateInput.value;
        const category = categoryInput.value;
        const type = document.querySelector('input[name="type"]:checked').value;

        if (
            description === "" ||
            isNaN(amount) ||
            date === "" ||
            category === ""
        ) {
            alert("Please fill in all fields");
            return;
        }

        const transaction = {
            id: generateID(),
            description,
            amount,
            date,
            category,
            type,
        };

        transactions.push(transaction);
        updateLocalStorage();
        addTransactionToDOM(transaction);
        updateBalance();
        updateMonthlyChart();
        updateCategoryChart(); // Added this line to update pie chart on form submission
        transactionForm.reset();
    });

    // Filter transactions
    searchInput.addEventListener("input", filterTransactions);
    filterCategory.addEventListener("change", filterTransactions);

    // Theme toggle
    themeToggle.addEventListener("change", function () {
        document.body.setAttribute(
            "data-theme",
            this.checked ? "dark" : "light"
        );
        localStorage.setItem("theme", this.checked ? "dark" : "light");
    });

    // Initialize app
    function init() {
        // Set theme from local storage
        const savedTheme = localStorage.getItem("theme") || "light";
        document.body.setAttribute("data-theme", savedTheme);
        themeToggle.checked = savedTheme === "dark";

        // Set today's date as default
        dateInput.valueAsDate = new Date();

        // Load transactions
        transactions.forEach((transaction) => addTransactionToDOM(transaction));
        updateBalance();
        updateMonthlyChart();
        updateCategoryChart();
    }

    // Add transaction to DOM
    function addTransactionToDOM(transaction) {
        const li = document.createElement("li");
        li.className = "transaction-item";
        li.dataset.id = transaction.id;

        const amountClass =
            transaction.type === "income" ? "income-amount" : "expense-amount";
        const sign = transaction.type === "income" ? "+" : "-";

        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-description">${
                    transaction.description
                }</div>
                <div class="transaction-meta">
                    <span class="transaction-category">${
                        transaction.category
                    }</span>
                    <span class="transaction-date">${formatDate(
                        transaction.date
                    )}</span>
                </div>
            </div>
            <div class="transaction-amount ${amountClass}">${sign}R${Math.abs(
            transaction.amount
        ).toFixed(2)}</div>
            <button class="delete-btn" data-id="${
                transaction.id
            }"><i class="fas fa-trash-alt"></i></button>
        `;

        transactionsList.appendChild(li);

        // Add delete event
        li.querySelector(".delete-btn").addEventListener("click", function () {
            const id = this.dataset.id;
            deleteTransaction(id);
        });
    }

    function deleteTransaction(id) {
        // Convert ID to number (since HTML data attributes are strings)
        id = Number(id);

        // Remove from the transactions array
        transactions = transactions.filter(
            (transaction) => transaction.id !== id
        );

        // Update localStorage
        updateLocalStorage();

        // Remove from the DOM
        const transactionEl = document.querySelector(`li[data-id="${id}"]`);
        if (transactionEl) {
            transactionEl.remove();
        }

        // Recalculate balances
        updateBalance();
        updateMonthlyChart();
        updateCategoryChart();
    }

    // Update balance
    function updateBalance() {
        const amounts = transactions.map((transaction) =>
            transaction.type === "income"
                ? transaction.amount
                : -transaction.amount
        );

        const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
        const income = amounts
            .filter((item) => item > 0)
            .reduce((acc, item) => acc + item, 0)
            .toFixed(2);
        const expense = amounts
            .filter((item) => item < 0)
            .reduce((acc, item) => acc + item, 0)
            .toFixed(2);

        balanceAmount.textContent = `R${total}`;
        incomeAmount.textContent = `R${income}`;
        expenseAmount.textContent = `R${Math.abs(expense)}`;
    }

    // Filter transactions
    function filterTransactions() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = filterCategory.value;

        const filteredTransactions = transactions.filter((transaction) => {
            const matchesSearch = transaction.description
                .toLowerCase()
                .includes(searchTerm);
            const matchesCategory =
                categoryFilter === "" ||
                transaction.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });

        transactionsList.innerHTML = "";
        filteredTransactions.forEach((transaction) =>
            addTransactionToDOM(transaction)
        );

        updateMonthlyChart();
        updateCategoryChart();
    }

    // Update monthly chart
    function updateMonthlyChart() {
        // Group transactions by month
        const monthlyData = {};

        transactions.forEach((transaction) => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    income: 0,
                    expense: 0,
                };
            }

            if (transaction.type === "income") {
                monthlyData[monthYear].income += transaction.amount;
            } else {
                monthlyData[monthYear].expense += transaction.amount;
            }
        });

        // Sort months chronologically
        const sortedMonths = Object.keys(monthlyData).sort();

        // Prepare data for chart
        const labels = sortedMonths.map((month) => {
            const [year, monthNum] = month.split("-");
            return new Date(year, monthNum - 1).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
            });
        });

        const incomeData = sortedMonths.map(
            (month) => monthlyData[month].income
        );
        const expenseData = sortedMonths.map(
            (month) => monthlyData[month].expense
        );

        // Create or update chart
        if (monthlyChart) {
            monthlyChart.data.labels = labels;
            monthlyChart.data.datasets[0].data = incomeData;
            monthlyChart.data.datasets[1].data = expenseData;
            monthlyChart.update();
        } else {
            monthlyChart = new Chart(monthlyChartCtx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Income",
                            data: incomeData,
                            backgroundColor: "rgba(76, 175, 80, 0.7)",
                            borderColor: "rgba(76, 175, 80, 1)",
                            borderWidth: 1,
                        },
                        {
                            label: "Expense",
                            data: expenseData,
                            backgroundColor: "rgba(244, 67, 54, 0.7)",
                            borderColor: "rgba(244, 67, 54, 1)",
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return "R" + value.toFixed(2);
                                },
                            },
                        },
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return (
                                        context.dataset.label +
                                        ": R" +
                                        context.raw.toFixed(2)
                                    );
                                },
                            },
                        },
                    },
                },
            });
        }
    }

    // Update category chart
    function updateCategoryChart() {
        // Get current theme colors
        const isDark = document.body.getAttribute("data-theme") === "dark";
        const textColor = isDark ? "rgb(119, 119, 119)" : "rgb(119, 119, 119)";
        const borderColor = isDark
            ? "rgb(119, 119, 119)"
            : "rgb(119, 119, 119)";

        // Filter only expense transactions
        const expenses = transactions.filter((t) => t.type === "expense");

        // Group by category
        const categoryData = {};
        expenses.forEach((transaction) => {
            if (!categoryData[transaction.category]) {
                categoryData[transaction.category] = 0;
            }
            categoryData[transaction.category] += transaction.amount;
        });

        // Prepare data for chart
        const labels = Object.keys(categoryData).map(
            (category) =>
                category.charAt(0).toUpperCase() +
                category.slice(1).toLowerCase()
        );
        const data = Object.values(categoryData);

        // Category colors
        const backgroundColors = [
            "rgba(244, 67, 54, 0.8)", // Red
            "rgba(255, 152, 0, 0.8)", // Orange
            "rgba(255, 235, 59, 0.8)", // Yellow
            "rgba(76, 175, 80, 0.8)", // Green
            "rgba(33, 150, 243, 0.8)", // Blue
            "rgba(156, 39, 176, 0.8)", // Purple
            "rgba(233, 30, 99, 0.8)", // Pink
        ];

        // Create or update chart
        const ctx = document.getElementById("categoryChart").getContext("2d");

        if (categoryChart) {
            // Update existing chart
            categoryChart.data.labels = labels;
            categoryChart.data.datasets[0].data = data;
            categoryChart.data.datasets[0].backgroundColor =
                backgroundColors.slice(0, labels.length);
            categoryChart.update();
        } else {
            // Create new chart
            categoryChart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            backgroundColor: backgroundColors.slice(
                                0,
                                labels.length
                            ),
                            borderColor: borderColor,
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "right",
                            labels: {
                                color: textColor,
                                font: {
                                    size: 12,
                                    family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                                },
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${
                                        context.label
                                    }: R${context.raw.toFixed(2)}`;
                                },
                            },
                            bodyColor: textColor,
                            titleColor: textColor,
                            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
                            borderColor: borderColor,
                            borderWidth: 1,
                        },
                    },
                },
            });
        }
    }

    // Update local storage
    function updateLocalStorage() {
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }

    // Generate random ID
    function generateID() {
        return Math.floor(Math.random() * 1000000000);
    }

    // Format date
    function formatDate(dateString) {
        const options = { year: "numeric", month: "short", day: "numeric" };
        return new Date(dateString).toLocaleDateString("en-US", options);
    }
});
