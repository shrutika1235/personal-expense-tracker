
const API_URL = "http://localhost:8080/api/expenses";

const form = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const transactionList = document.getElementById("transactionList");
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filterType");
const message = document.getElementById("message");

let transactions = [];

function todayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.value = todayDate();

function showMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "red" : "green";
}

function formatMoney(amount) {
    return Number(amount).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR"
    });
}

async function loadTransactions() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load transactions.");
        }

        transactions = await response.json();

        renderTransactions();

    } catch (error) {
        showMessage(
            "Backend connection failed. Check whether Java server is running.",
            true
        );
    }
}

function updateSummary() {

    const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    document.getElementById("income").textContent =
        formatMoney(income);

    document.getElementById("expenses").textContent =
        formatMoney(expenses);

    document.getElementById("balance").textContent =
        formatMoney(income - expenses);
}

function renderTransactions() {

    transactionList.replaceChildren();

    const searchText = searchInput.value.toLowerCase().trim();
    const selectedType = filterType.value;

    const filtered = transactions.filter(t => {

        const matchesSearch =
            (t.title || "").toLowerCase().includes(searchText) ||
            (t.category || "").toLowerCase().includes(searchText);

        const matchesType =
            selectedType === "all" ||
            t.type === selectedType;

        return matchesSearch && matchesType;
    });

    document.getElementById("emptyMessage").hidden =
        filtered.length !== 0;

    filtered.forEach(t => {

        const row = document.createElement("tr");

        const values = [
            t.title,
            t.category,
            t.date,
            t.type === "income" ? "Income" : "Expense",
            formatMoney(t.amount)
        ];

        values.forEach((value, index) => {

            const cell = document.createElement("td");
            cell.textContent = value;

            if (index === 4) {
                cell.className =
                    t.type === "income"
                        ? "income-text"
                        : "expense-text";
            }

            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", async () => {

            if (!confirm("Delete this transaction?")) {
                return;
            }

            try {
                const response = await fetch(
                    `${API_URL}/${encodeURIComponent(t.id)}`,
                    { method: "DELETE" }
                );

                if (!response.ok) {
                    throw new Error("Delete failed.");
                }

                transactions = transactions.filter(
                    item => item.id !== t.id
                );

                renderTransactions();
                showMessage("Transaction deleted successfully!");

            } catch (error) {
                showMessage("Unable to delete transaction.", true);
            }
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        transactionList.appendChild(row);
    });

    updateSummary();
}

form.addEventListener("submit", async event => {

    event.preventDefault();

    const transaction = {
        title: titleInput.value.trim(),
        amount: Number(amountInput.value),
        type: typeInput.value,
        category: categoryInput.value,
        date: dateInput.value
    };

    if (
        !transaction.title ||
        !Number.isFinite(transaction.amount) ||
        transaction.amount <= 0 ||
        !transaction.date
    ) {
        showMessage("Please enter valid transaction details.", true);
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(transaction)
        });

        if (!response.ok) {
            throw new Error("Unable to add transaction.");
        }

        const savedTransaction = await response.json();

        transactions.unshift(savedTransaction);

        renderTransactions();

        form.reset();
        dateInput.value = todayDate();

        showMessage("Transaction added successfully!");

    } catch (error) {
        showMessage(
            "Unable to save transaction. Check your backend.",
            true
        );
    }
});

searchInput.addEventListener("input", renderTransactions);

filterType.addEventListener("change", renderTransactions);

document.getElementById("exportBtn").addEventListener("click", () => {

    if (transactions.length === 0) {
        alert("No transactions available to export.");
        return;
    }

    const escapeCSV = value =>
        '"' + String(value).replace(/"/g, '""') + '"';

    const headers = [
        "Name", "Amount", "Type", "Category", "Date"
    ];

    const rows = transactions.map(t => [
        t.title,
        t.amount,
        t.type,
        t.category,
        t.date
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "expense-report.csv";
    link.click();

    URL.revokeObjectURL(url);
});

loadTransactions();
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .then(() => {
                console.log("PWA registered successfully");
            })
            .catch(error => {
                console.error("PWA registration failed:", error);
            });
    });
}