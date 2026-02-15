package com.helpinminutes.shared.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;

/**
 * Utility class for date/time operations
 */
public class DateUtils {
    
    private static final DateTimeFormatter ISO_FORMATTER = 
        DateTimeFormatter.ISO_DATE_TIME;
    
    /**
     * Convert LocalDateTime to Date
     */
    public static Date toDate(LocalDateTime localDateTime) {
        if (localDateTime == null) return null;
        return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }
    
    /**
     * Convert Date to LocalDateTime
     */
    public static LocalDateTime toLocalDateTime(Date date) {
        if (date == null) return null;
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
    
    /**
     * Format LocalDateTime to ISO string
     */
    public static String toIsoString(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(ISO_FORMATTER);
    }
    
    /**
     * Parse ISO string to LocalDateTime
     */
    public static LocalDateTime fromIsoString(String isoString) {
        if (isoString == null || isoString.isEmpty()) return null;
        return LocalDateTime.parse(isoString, ISO_FORMATTER);
    }
    
    /**
     * Check if a date is within the last N minutes
     */
    public static boolean isWithinLastMinutes(LocalDateTime dateTime, int minutes) {
        if (dateTime == null) return false;
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(minutes);
        return dateTime.isAfter(cutoff);
    }
}