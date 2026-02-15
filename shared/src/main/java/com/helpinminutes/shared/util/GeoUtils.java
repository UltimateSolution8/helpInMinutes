package com.helpinminutes.shared.util;

/**
 * Utility class for geospatial calculations
 */
public class GeoUtils {
    
    private static final double EARTH_RADIUS_KM = 6371.0;
    
    /**
     * Calculate distance between two points using Haversine formula
     * 
     * @param lat1 Latitude of first point
     * @param lon1 Longitude of first point
     * @param lat2 Latitude of second point
     * @param lon2 Longitude of second point
     * @return Distance in kilometers
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return EARTH_RADIUS_KM * c;
    }
    
    /**
     * Check if a point is within a radius of another point
     * 
     * @param centerLat Center latitude
     * @param centerLon Center longitude
     * @param pointLat Point latitude
     * @param pointLon Point longitude
     * @param radiusKm Radius in kilometers
     * @return true if point is within radius
     */
    public static boolean isWithinRadius(double centerLat, double centerLon, 
                                        double pointLat, double pointLon, 
                                        double radiusKm) {
        double distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
        return distance <= radiusKm;
    }
}