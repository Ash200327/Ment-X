package com.mentx.config;

import com.mentx.model.Role;
import com.mentx.model.User;
import com.mentx.model.UserStatus;
import com.mentx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.seed.admin.email}")
    private String adminEmail;

    @org.springframework.beans.factory.annotation.Value("${app.seed.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
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
