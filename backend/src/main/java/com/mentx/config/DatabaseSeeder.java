package com.mentx.config;

import com.mentx.model.Role;
import com.mentx.model.User;
import com.mentx.model.UserStatus;
import com.mentx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Value("${app.seed.admin.email}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${app.seed.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        // Drop NOT NULL constraint on assignment_id for manual scores
        try {
            jdbcTemplate.execute("ALTER TABLE scores ALTER COLUMN assignment_id DROP NOT NULL;");
            System.out.println("====== DB SCHEMA FIX: assignment_id constraint dropped successfully ======");
        } catch (Exception e) {
            System.err.println("====== DB SCHEMA FIX ERROR: " + e.getMessage() + " ======");
        }

        // Alter notifications message column to TEXT to prevent VARCHAR(255) overflows
        try {
            jdbcTemplate.execute("ALTER TABLE notifications ALTER COLUMN message TYPE TEXT;");
            System.out.println("====== DB SCHEMA FIX: notifications.message column altered to TEXT successfully ======");
        } catch (Exception e) {
            System.err.println("====== DB SCHEMA FIX ERROR: " + e.getMessage() + " ======");
        }

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .name("Platform Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ADMIN)
                    .status(UserStatus.APPROVED)
                    .verified(true)
                    .build();
            userRepository.save(admin);
            System.out.println("====== SEED DATA: Admin user seeded successfully ======");
        }
    }
}
