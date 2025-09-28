package com.example.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");

        return userRepository.findByUsername(username)
                .map(user -> {
                    if (user.getPassword().equals(password)) { // simple match; use hashing in prod
                        return ResponseEntity.ok(Map.of(
                                "id", user.getId(),
                                "username", user.getUsername(),
                                "role", user.getRole()
                        ));
                    } else {
                        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
                    }
                })
                .orElse(ResponseEntity.status(404).body(Map.of("error", "User not found")));
    }
}
