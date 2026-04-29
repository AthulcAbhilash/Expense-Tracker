let expenses = initialExpenses || [];

const expenseList = document.getElementById("expenseList");
const totalExpense = document.getElementById("totalExpense");
const monthExpense = document.getElementById("monthExpense");
const topCategory = document.getElementById("topCategory");
const budgetLeft = document.getElementById("budgetLeft");
const expenseCount = document.getElementById("expenseCount");
const categoryBreakdown = document.getElementById("categoryBreakdown");

const expenseModal = document.getElementById("expenseModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");
const modalTitle = document.getElementById("modalTitle");

const expenseForm = document.getElementById("expenseForm");
const expenseIdInput = document.getElementById("expenseId");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const expenseDateInput = document.getElementById("expenseDate");
const paymentModeInput = document.getElementById("paymentMode");
const notesInput = document.getElementById("notes");

const monthFilter = document.getElementById("monthFilter");
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");

const categoryIcons = {
    Food: "🥗",
    Travel: "🛵",
    Shopping: "🛍️",
    Bills: "📄",
    Health: "💪",
    Education: "📘",
    Entertainment: "🎬",
    Savings: "💰",
    Investment: "📈",
    Stock: "📊",
    EMI: "🏦",
    Rent: "🏠",
    Insurance: "🛡️",
    Other: "💸"
};

function formatCurrency(value) {
    return "₹" + Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getSavedBudget() {
    return Number(localStorage.getItem("expenseTrackerBudget")) || 0;
}

function setSavedBudget(value) {
    localStorage.setItem("expenseTrackerBudget", value);
}

function openModal(isEdit = false) {
    expenseModal.classList.remove("hidden");
    modalTitle.textContent = isEdit ? "Edit Expense" : "Add Expense";
}

function closeModal() {
    expenseModal.classList.add("hidden");
    expenseForm.reset();
    expenseIdInput.value = "";
    modalTitle.textContent = "Add Expense";
}

function getFilteredExpenses() {
    let filtered = [...expenses];

    const selectedMonth = monthFilter.value;
    const selectedCategory = categoryFilter.value;
    const searchText = searchInput.value.trim().toLowerCase();

    if (selectedMonth) {
        filtered = filtered.filter(expense => expense.date.startsWith(selectedMonth));
    }

    if (selectedCategory !== "All") {
        filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    if (searchText) {
        filtered = filtered.filter(expense =>
            expense.title.toLowerCase().includes(searchText) ||
            (expense.notes && expense.notes.toLowerCase().includes(searchText))
        );
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    return filtered;
}

function renderExpenses() {
    const filteredExpenses = getFilteredExpenses();
    expenseList.innerHTML = "";

    expenseCount.textContent = `${filteredExpenses.length} item${filteredExpenses.length !== 1 ? "s" : ""}`;

    if (filteredExpenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <h4>No expenses found</h4>
                <p>Add a new expense or change your filters.</p>
            </div>
        `;
        return;
    }

    filteredExpenses.forEach(expense => {
        const item = document.createElement("div");
        item.className = "expense-item";

        item.innerHTML = `
            <div class="expense-icon">${categoryIcons[expense.category] || "💸"}</div>

            <div class="expense-main">
                <h4>${expense.title}</h4>
                <div class="expense-meta">
                    <span>${expense.category}</span>
                    <span>${formatDate(expense.date)}</span>
                    <span>${expense.payment_mode}</span>
                </div>
                <div class="expense-notes">${expense.notes ? expense.notes : "No notes added"}</div>
            </div>

            <div class="expense-right">
                <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                <div class="action-row">
                    <button class="edit-btn" onclick="editExpense(${expense.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
                </div>
            </div>
        `;

        expenseList.appendChild(item);
    });
}

function renderSummary() {
    const filteredExpenses = getFilteredExpenses();
    const allTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    totalExpense.textContent = formatCurrency(allTotal);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthTotal = expenses
        .filter(expense => expense.date.startsWith(currentMonth))
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

    monthExpense.textContent = formatCurrency(currentMonthTotal);

    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + Number(expense.amount);
    });

    let highestCategory = "-";
    let highestAmount = 0;

    for (const category in categoryTotals) {
        if (categoryTotals[category] > highestAmount) {
            highestAmount = categoryTotals[category];
            highestCategory = category;
        }
    }

    topCategory.textContent = highestCategory;

    const budget = getSavedBudget();
    const remaining = budget - currentMonthTotal;
    budgetLeft.textContent = budget ? formatCurrency(remaining) : "Not set";
}

function renderBreakdown() {
    const filteredExpenses = getFilteredExpenses();
    categoryBreakdown.innerHTML = "";

    if (filteredExpenses.length === 0) {
        categoryBreakdown.innerHTML = `
            <div class="empty-state">
                <h4>No breakdown yet</h4>
                <p>Add expenses to see category insights.</p>
            </div>
        `;
        return;
    }

    const totals = {};
    let grandTotal = 0;

    filteredExpenses.forEach(expense => {
        totals[expense.category] = (totals[expense.category] || 0) + Number(expense.amount);
        grandTotal += Number(expense.amount);
    });

    const sortedCategories = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([category, amount]) => {
        const percentage = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;

        const item = document.createElement("div");
        item.className = "breakdown-item";
        item.innerHTML = `
            <div class="breakdown-top">
                <span class="breakdown-title">${categoryIcons[category] || "💸"} ${category}</span>
                <span class="breakdown-value">${formatCurrency(amount)} (${percentage.toFixed(1)}%)</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        categoryBreakdown.appendChild(item);
    });
}

async function fetchExpenses() {
    try {
        const response = await fetch("/get-expenses");
        expenses = await response.json();
        renderAll();
    } catch (error) {
        console.error("Error fetching expenses:", error);
    }
}

async function deleteExpense(id) {
    const confirmDelete = confirm("Are you sure you want to delete this expense?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(`/delete-expense/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (result.success) {
            await fetchExpenses();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error deleting expense:", error);
        alert("Something went wrong while deleting expense.");
    }
}

function editExpense(id) {
    const expense = expenses.find(item => item.id === id);
    if (!expense) return;

    expenseIdInput.value = expense.id;
    titleInput.value = expense.title;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    expenseDateInput.value = expense.date;
    paymentModeInput.value = expense.payment_mode;
    notesInput.value = expense.notes || "";

    openModal(true);
}

async function saveExpense(event) {
    event.preventDefault();

    const payload = {
        title: titleInput.value.trim(),
        amount: amountInput.value,
        category: categoryInput.value,
        date: expenseDateInput.value,
        payment_mode: paymentModeInput.value,
        notes: notesInput.value.trim()
    };

    const expenseId = expenseIdInput.value;
    const isEditMode = expenseId !== "";

    const url = isEditMode ? `/update-expense/${expenseId}` : "/add-expense";
    const method = isEditMode ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            closeModal();
            await fetchExpenses();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error saving expense:", error);
        alert("Something went wrong while saving expense.");
    }
}

function renderAll() {
    renderExpenses();
    renderSummary();
    renderBreakdown();
}

let pieChart, barChart;

function exportToCSV() {
    let csv = "Title,Amount,Category,Date\n";

    expenses.forEach(e => {
        csv += `${e.title},${e.amount},${e.category},${e.date}\n`;
    });

    let blob = new Blob([csv]);
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "expenses.csv";
    a.click();
}

function renderCharts(type) {

    const pieCanvas = document.getElementById("categoryPieChart");
    const barCanvas = document.getElementById("monthlyBarChart");

    if (!pieCanvas || !barCanvas) return; // 🔥 prevents crash

    const filteredExpenses = getFilteredExpenses();

    let categoryTotals = {};
    let monthlyTotals = {};

    filteredExpenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;

        let m = e.date.slice(0,7);
        monthlyTotals[m] = (monthlyTotals[m] || 0) + e.amount;
    });

    if (window.pieChart) window.pieChart.destroy();
    if (window.barChart) window.barChart.destroy();

    if (type === "pie") {
        window.pieChart = new Chart(pieCanvas, {
            type: "pie",
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals)
                }]
            }
        });
    }

    if (type === "bar") {
        window.barChart = new Chart(barCanvas, {
            type: "bar",
            data: {
                labels: Object.keys(monthlyTotals),
                datasets: [{
                    label: "Monthly Expense",
                    data: Object.values(monthlyTotals)
                }]
            }
        });
    }
}

openModalBtn.addEventListener("click", () => {
    expenseForm.reset();
    expenseIdInput.value = "";
    expenseDateInput.value = new Date().toISOString().split("T")[0];
    openModal(false);
});

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

expenseModal.addEventListener("click", (event) => {
    if (event.target === expenseModal) {
        closeModal();
    }
});

document.getElementById("pieBtn").onclick = () => {
    document.getElementById("chartPanel").classList.remove("hidden");
    renderCharts("pie");
};

document.getElementById("barBtn").onclick = () => {
    document.getElementById("chartPanel").classList.remove("hidden");
    renderCharts("bar");
};

document.getElementById("exportBtn").onclick = exportToCSV;

expenseForm.addEventListener("submit", saveExpense);

monthFilter.addEventListener("input", renderAll);
categoryFilter.addEventListener("change", renderAll);
searchInput.addEventListener("input", renderAll);

clearFiltersBtn.addEventListener("click", () => {
    monthFilter.value = "";
    categoryFilter.value = "All";
    searchInput.value = "";
    renderAll();
});

saveBudgetBtn.addEventListener("click", () => {
    const value = Number(budgetInput.value);
    if (!value || value <= 0) {
        alert("Please enter a valid budget.");
        return;
    }
    setSavedBudget(value);
    renderSummary();
    alert("Budget saved successfully.");
});

window.addEventListener("DOMContentLoaded", () => {
    budgetInput.value = getSavedBudget() || "";
    expenseDateInput.value = new Date().toISOString().split("T")[0];
    renderAll();
});