package com.snapurl.backend.service;

import org.springframework.stereotype.Component;

@Component
public class Base62Encoder {

    private static final String BASE62_CHARACTERS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int BASE = BASE62_CHARACTERS.length();

    /**
     * Encodes a numeric ID to a Base62 string.
     */
    public String encode(long input) {
        if (input == 0) {
            return String.valueOf(BASE62_CHARACTERS.charAt(0));
        }
        
        StringBuilder sb = new StringBuilder();
        while (input > 0) {
            int remainder = (int) (input % BASE);
            sb.append(BASE62_CHARACTERS.charAt(remainder));
            input = input / BASE;
        }
        
        // Reverse because we extracted the least significant digit first
        return sb.reverse().toString();
    }

    /**
     * Decodes a Base62 string back into a numeric ID.
     */
    public long decode(String input) {
        long result = 0;
        long multiplier = 1;
        
        // Process from right to left
        for (int i = input.length() - 1; i >= 0; i--) {
            char c = input.charAt(i);
            int index = BASE62_CHARACTERS.indexOf(c);
            if (index == -1) {
                throw new IllegalArgumentException("Invalid Base62 character: " + c);
            }
            result += index * multiplier;
            multiplier *= BASE;
        }
        
        return result;
    }
}
