import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HelperCard = ({ helper, onPress, onAccept, distance, isMatching = false }) => {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <TouchableOpacity
      style={[styles.card, isMatching && styles.matchingCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {helper.profileImage ? (
            <Image source={{ uri: helper.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(helper.firstName, helper.lastName)}</Text>
            </View>
          )}
          {helper.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name}>
            {helper.firstName} {helper.lastName}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>{helper.rating?.toFixed(1) || 'N/A'}</Text>
            <Text style={styles.tasksText}>({helper.completedTasks || 0} tasks)</Text>
          </View>
          {distance && (
            <Text style={styles.distanceText}>
              <Ionicons name="location-outline" size={12} color="#8E8E93" />
              {' '}{distance.toFixed(1)} km away
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {helper.responseTime && (
            <Text style={styles.responseTime}>{helper.responseTime}</Text>
          )}
        </View>
      </View>

      {helper.skills && helper.skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {helper.skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill.name}</Text>
            </View>
          ))}
          {helper.skills.length > 3 && (
            <Text style={styles.moreSkills}>+{helper.skills.length - 3}</Text>
          )}
        </View>
      )}

      {helper.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {helper.bio}
        </Text>
      )}

      {isMatching && onAccept && (
        <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept(helper)}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchingCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB800',
  },
  tasksText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#8E8E93',
  },
  distanceText: {
    marginTop: 4,
    fontSize: 12,
    color: '#8E8E93',
  },
  actions: {
    alignItems: 'flex-end',
  },
  responseTime: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  skillBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: '#666',
  },
  moreSkills: {
    fontSize: 12,
    color: '#007AFF',
    paddingVertical: 4,
  },
  bio: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default HelperCard;
