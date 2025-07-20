// Register Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/expense-tracker/sw.js", { scope: "/expense-tracker/" })
        .then((reg) => console.log("SW registered for scope:", reg.scope))
        .catch((err) => console.error("SW failed:", err));
}

// Check Online/Offline Status
window.addEventListener("online", () => {
    console.log("Back online!");
    // Optional: Sync data if needed
});

window.addEventListener("offline", () => {
    console.log("Offline mode - using cached data");
});

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
    const savingsAmount = document.getElementById("savings-amount");
    const searchInput = document.getElementById("search");
    const filterCategory = document.getElementById("filter-category");
    const themeToggle = document.getElementById("toggle_checkbox");
    const monthlyChartCtx = document.getElementById("monthlyChart");
    let monthlyChart;

    // Initialize transactions array from local storage
    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    function updateLocalStorage() {
        try {
            localStorage.setItem("transactions", JSON.stringify(transactions));
        } catch (e) {
            alert("Failed to save data. Your browser storage might be full.");
        }
    }
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

        // Validate inputs
        const today = new Date().toISOString().split("T")[0];
        if (date > today) {
            alert("Future dates not allowed");
            return;
        }

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
            amount: parseFloat(amount),
            date,
            category,
            type,
        };

        transactions.push(transaction);
        updateLocalStorage();
        addTransactionToDOM(transaction);
        updateBalance();
        updateMonthlyChart();
        updateCategoryChart();
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

        document
            .getElementById("export-csv")
            .addEventListener("click", exportToCSV);
        document
            .getElementById("export-pdf")
            .addEventListener("click", exportToPDF);
    }

    // Add transaction to DOM
    function addTransactionToDOM(transaction) {
        const li = document.createElement("li");
        li.className = "transaction-item";
        li.dataset.id = transaction.id;

        let amountClass, sign;
        if (transaction.type === "income") {
            amountClass = "income-amount";
            sign = "+";
        } else if (transaction.type === "expense") {
            amountClass = "expense-amount";
            sign = "-";
        } else {
            amountClass = "savings-amount";
            sign = "-";
        }

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
        const amounts = transactions.map((transaction) => {
            if (transaction.type === "income") return transaction.amount;
            if (transaction.type === "expense") return -transaction.amount;
            return -transaction.amount; // savings don't affect the balance directly
        });

        const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
        const income = transactions
            .filter((t) => t.type === "income")
            .reduce((acc, t) => acc + t.amount, 0)
            .toFixed(2);
        const expense = transactions
            .filter((t) => t.type === "expense")
            .reduce((acc, t) => acc + t.amount, 0)
            .toFixed(2);
        const savings = transactions
            .filter((t) => t.type === "savings")
            .reduce((acc, t) => acc + t.amount, 0)
            .toFixed(2);

        balanceAmount.textContent = `R${total}`;
        incomeAmount.textContent = `R${income}`;
        expenseAmount.textContent = `R${expense}`;
        savingsAmount.textContent = `R${savings}`;
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
                    savings: 0,
                };
            }

            if (transaction.type === "income") {
                monthlyData[monthYear].income += transaction.amount;
            } else if (transaction.type === "expense") {
                monthlyData[monthYear].expense += transaction.amount;
            } else {
                monthlyData[monthYear].savings += transaction.amount;
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
        const savingsData = sortedMonths.map(
            (month) => monthlyData[month].savings
        );

        // Create or update chart
        if (monthlyChart) {
            monthlyChart.data.labels = labels;
            monthlyChart.data.datasets[0].data = incomeData;
            monthlyChart.data.datasets[1].data = expenseData;
            monthlyChart.data.datasets[2].data = savingsData;
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
                        {
                            label: "Savings",
                            data: savingsData,
                            backgroundColor: "rgba(33, 150, 243, 0.7)",
                            borderColor: "rgba(33, 150, 243, 1)",
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
        const textColor = isDark ? "#e0e0e0" : "#333333";
        const borderColor = isDark ? "#2c2c2c" : "#e0e0e0";

        // Separate expenses and savings
        const expenses = transactions.filter((t) => t.type === "expense");
        const savings = transactions.filter((t) => t.type === "savings");

        // Process expenses (will use all colors except blue)
        const expenseData = {};
        expenses.forEach((transaction) => {
            if (!expenseData[transaction.category]) {
                expenseData[transaction.category] = 0;
            }
            expenseData[transaction.category] += transaction.amount;
        });

        // Process savings (will use blue color)
        const savingsData = {};
        savings.forEach((transaction) => {
            if (!savingsData[transaction.category]) {
                savingsData[transaction.category] = 0;
            }
            savingsData[transaction.category] += transaction.amount;
        });

        // Prepare data for chart - expenses first, then savings
        const labels = [
            ...Object.keys(expenseData).map((c) => `${c}`),
            ...Object.keys(savingsData).map((c) => `${c}`),
        ];

        const data = [
            ...Object.values(expenseData),
            ...Object.values(savingsData),
        ];

        // Color palette - reserve blue (rgb(33, 150, 243)) for savings
        const backgroundColors = [
            // Colors for expenses (everything except blue)
            "#FF5252", // Red
            "#72ff07ff", // Green
            "#9C27B0", // Purple
            "#FF9800", // Orange
            "#795548", // Brown
            "#607D8B", // Blue Grey
            "#E91E63", // Pink
            "#8BC34A", // Light Green
            "#00BCD4", // Cyan
            "#3F51B5", // Indigo
            "#CDDC39", // Lime
            "#673AB7", // Deep Purple
        ];

        // Assign blue to all savings categories
        const savingsColors = Array(Object.keys(savingsData).length).fill(
            "rgba(33, 150, 243, 0.8)"
        );

        // Combine colors
        const allColors = [
            ...backgroundColors.slice(0, Object.keys(expenseData).length),
            ...savingsColors,
        ];

        // Create or update chart
        const ctx = document.getElementById("categoryChart").getContext("2d");

        if (categoryChart) {
            categoryChart.data.labels = labels;
            categoryChart.data.datasets[0].data = data;
            categoryChart.data.datasets[0].backgroundColor = allColors;
            categoryChart.update();
        } else {
            categoryChart = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            backgroundColor: allColors,
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
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    // Format date
    function formatDate(dateString) {
        const options = { year: "numeric", month: "short", day: "numeric" };
        return new Date(dateString).toLocaleDateString("en-US", options);
    }

    // CSV Export
    function exportToCSV() {
        if (transactions.length === 0) {
            alert("No transactions to export");
            return;
        }

        const btn = document.getElementById("export-csv");
        const originalText = btn.textContent;

        // Set loading state
        btn.disabled = true;
        btn.textContent = "Generating CSV...";
        btn.classList.add("export-loading");

        setTimeout(() => {
            try {
                const exportDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
                let csv = "ID,Description,Amount,Date,Category,Type\n";
                transactions.forEach((transaction) => {
                    csv += `${transaction.id},"${transaction.description}",${transaction.amount},"${transaction.date}","${transaction.category}","${transaction.type}"\n`;
                });

                const blob = new Blob([csv], {
                    type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `spendr_transactions_${exportDate}.csv`; // Use exportDate here
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) {
                console.error("CSV export failed:", e);
                alert("Failed to generate CSV. Please try again.");
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
                btn.classList.remove("export-loading");
            }
        }, 100); // Small delay for UI responsiveness
    }

    // PDF Export
    function exportToPDF() {
        if (transactions.length === 0) {
            alert("No transactions to export");
            return;
        }

        const btn = document.getElementById("export-pdf");
        const originalText = btn.textContent;

        // Set loading state
        btn.disabled = true;
        btn.textContent = "Generating PDF...";
        btn.classList.add("export-loading"); // Add loading class for styling

        // Use setTimeout to allow UI to update before heavy PDF generation
        setTimeout(() => {
            try {
                const exportDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Add title
                doc.setFontSize(18);
                doc.text("Spendr Transaction History", 14, 20);

                // Add date
                doc.setFontSize(10);
                doc.text(
                    `Exported on: ${new Date().toLocaleDateString()}`,
                    14,
                    28
                );

                // Add balance summary
                doc.setFontSize(12);
                doc.text(
                    `Current Balance: R${balanceAmount.textContent.substring(
                        1
                    )}`,
                    14,
                    36
                );
                doc.text(
                    `Total Income: R${incomeAmount.textContent.substring(1)}`,
                    14,
                    44
                );
                doc.text(
                    `Total Expenses: R${expenseAmount.textContent.substring(
                        1
                    )}`,
                    14,
                    52
                );
                doc.text(
                    `Total Savings: R${savingsAmount.textContent.substring(1)}`,
                    14,
                    60
                );

                // Prepare table data
                const tableData = transactions.map((transaction) => [
                    transaction.id,
                    transaction.description,
                    transaction.type === "income"
                        ? `R${transaction.amount.toFixed(2)}`
                        : `-R${transaction.amount.toFixed(2)}`,
                    formatDate(transaction.date),
                    transaction.category.charAt(0).toUpperCase() +
                        transaction.category.slice(1),
                    transaction.type.charAt(0).toUpperCase() +
                        transaction.type.slice(1),
                ]);

                // Add table
                doc.autoTable({
                    startY: 68,
                    head: [
                        [
                            "ID",
                            "Description",
                            "Amount",
                            "Date",
                            "Category",
                            "Type",
                        ],
                    ],
                    body: tableData,
                    theme: "grid",
                    headStyles: {
                        fillColor: [33, 150, 243],
                        textColor: 255,
                    },
                    styles: {
                        cellPadding: 3,
                        fontSize: 9,
                        valign: "middle",
                    },
                    columnStyles: {
                        0: { cellWidth: 15 },
                        1: { cellWidth: 50 },
                        2: { cellWidth: 25 },
                        3: { cellWidth: 30 },
                        4: { cellWidth: 30 },
                        5: { cellWidth: 25 },
                    },
                });

                // Save the PDF
                doc.save(`spendr_transactions_${exportDate}.pdf`); // Use exportDate here
            } catch (e) {
                console.error("PDF generation failed:", e);
                alert("Failed to generate PDF. Please try again.");
            } finally {
                // Reset button state
                btn.disabled = false;
                btn.textContent = originalText;
                btn.classList.remove("export-loading");
            }
        }, 100); // Small delay to ensure UI responsiveness
    }
});
