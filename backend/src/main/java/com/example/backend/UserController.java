package com.example.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // GET all users
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // POST create user
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(400).body(Map.of("error", "Username already exists"));
        }
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User created successfully"));
    }

    // PUT update user
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User updated) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setUsername(updated.getUsername());
                    user.setEmail(updated.getEmail());
                    user.setRole(updated.getRole());
                    if (updated.getPassword() != null && !updated.getPassword().isEmpty()) {
                        user.setPassword(updated.getPassword());
                    }
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("message", "User updated successfully"));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("error", "User not found")));
    }

    // DELETE user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
