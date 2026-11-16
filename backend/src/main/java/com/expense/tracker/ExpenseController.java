
package com.expense.tracker;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    private final ExpenseRepository repository;

    public ExpenseController(ExpenseRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Expense> getExpenses() {
        return repository.findAll(
            Sort.by(Sort.Direction.DESC, "date")
        );
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

        Expense savedExpense = repository.save(expense);

        return ResponseEntity.ok(savedExpense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable String id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
