package com.helpinminutes.identity;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class VerifyJwt {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("Usage: java VerifyJwt <password>");
            return;
        }
        
        String password = args[0];
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String hashedPassword = encoder.encode(password);
        
        System.out.println("Bcrypt hash for '" + password + "': " + hashedPassword);
    }
}
