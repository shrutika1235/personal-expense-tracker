
package com.expense.tracker;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    private final List<Expense> expenses =
            new CopyOnWriteArrayList<>();

    @GetMapping
    public List<Expense> getExpenses() {
        return expenses;
    }

    @PostMapping
    public ResponseEntity<Expense> addExpense(
            @RequestBody Expense expense) {

        if (expense.getTitle() == null ||
            expense.getTitle().isBlank() ||
            expense.getAmount() <= 0 ||
            expense.getDate() == null ||
            expense.getType() == null ||
            expense.getCategory() == null ||
            (!expense.getType().equals("income") &&
             !expense.getType().equals("expense"))) {

            return ResponseEntity.badRequest().build();
        }

        expense.setId(UUID.randomUUID().toString());
        expenses.add(0, expense);

        return ResponseEntity.ok(expense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable String id) {

        boolean removed = expenses.removeIf(
                expense -> expense.getId().equals(id)
        );

        if (removed) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.notFound().build();
    }
}
