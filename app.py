from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

DATA_FILE = "expenses.json"


def load_data():
    if not os.path.exists(DATA_FILE):
        return {"expenses": []}

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            content = file.read().strip()
            if not content:
                return {"expenses": []}
            return json.loads(content)
    except (json.JSONDecodeError, FileNotFoundError):
        return {"expenses": []}


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)


def get_next_id(expenses):
    if not expenses:
        return 1
    return max(expense["id"] for expense in expenses) + 1


@app.route("/")
def index():
    data = load_data()
    return render_template("index.html", expenses=data["expenses"])


@app.route("/get-expenses", methods=["GET"])
def get_expenses():
    data = load_data()
    return jsonify(data["expenses"])


@app.route("/add-expense", methods=["POST"])
def add_expense():
    data = load_data()
    expenses = data["expenses"]

    form_data = request.get_json()

    title = form_data.get("title", "").strip()
    amount = form_data.get("amount", "")
    category = form_data.get("category", "").strip()
    expense_date = form_data.get("date", "").strip()
    payment_mode = form_data.get("payment_mode", "").strip()
    notes = form_data.get("notes", "").strip()

    if not title or not amount or not category or not expense_date or not payment_mode:
        return jsonify({"success": False, "message": "Please fill all required fields."}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"success": False, "message": "Amount must be greater than 0."}), 400
    except ValueError:
        return jsonify({"success": False, "message": "Invalid amount."}), 400

    try:
        datetime.strptime(expense_date, "%Y-%m-%d")
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format."}), 400

    new_expense = {
        "id": get_next_id(expenses),
        "title": title,
        "amount": amount,
        "category": category,
        "date": expense_date,
        "payment_mode": payment_mode,
        "notes": notes
    }

    expenses.append(new_expense)
    save_data(data)

    return jsonify({"success": True, "message": "Expense added successfully."})


@app.route("/delete-expense/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    data = load_data()
    expenses = data["expenses"]

    updated_expenses = [expense for expense in expenses if expense["id"] != expense_id]

    if len(updated_expenses) == len(expenses):
        return jsonify({"success": False, "message": "Expense not found."}), 404

    data["expenses"] = updated_expenses
    save_data(data)

    return jsonify({"success": True, "message": "Expense deleted successfully."})


@app.route("/update-expense/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):
    data = load_data()
    expenses = data["expenses"]
    form_data = request.get_json()

    for expense in expenses:
        if expense["id"] == expense_id:
            title = form_data.get("title", "").strip()
            amount = form_data.get("amount", "")
            category = form_data.get("category", "").strip()
            expense_date = form_data.get("date", "").strip()
            payment_mode = form_data.get("payment_mode", "").strip()
            notes = form_data.get("notes", "").strip()

            if not title or not amount or not category or not expense_date or not payment_mode:
                return jsonify({"success": False, "message": "Please fill all required fields."}), 400

            try:
                amount = float(amount)
                if amount <= 0:
                    return jsonify({"success": False, "message": "Amount must be greater than 0."}), 400
            except ValueError:
                return jsonify({"success": False, "message": "Invalid amount."}), 400

            try:
                datetime.strptime(expense_date, "%Y-%m-%d")
            except ValueError:
                return jsonify({"success": False, "message": "Invalid date format."}), 400

            expense["title"] = title
            expense["amount"] = amount
            expense["category"] = category
            expense["date"] = expense_date
            expense["payment_mode"] = payment_mode
            expense["notes"] = notes

            save_data(data)
            return jsonify({"success": True, "message": "Expense updated successfully."})

    return jsonify({"success": False, "message": "Expense not found."}), 404


if __name__ == "__main__":
    app.run(debug=True)