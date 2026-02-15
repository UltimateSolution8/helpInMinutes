import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchTaskSkills } from '../services/taskApi';

const SkillSelector = ({ selectedSkill, onSkillSelect, categoryId, placeholder = 'Select a skill' }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded && categoryId) {
      loadSkills();
    }
  }, [isExpanded, categoryId]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const response = await fetchTaskSkills(categoryId);
      setSkills(response || []);
    } catch (error) {
      console.error('Failed to load skills:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skills.filter((skill) =>
    skill.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSkillSelect = (skill) => {
    onSkillSelect?.(skill);
    setIsExpanded(false);
    setSearchQuery('');
  };

  const renderSkillItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.skillItem, selectedSkill?.id === item.id && styles.selectedSkillItem]}
      onPress={() => handleSkillSelect(item)}
    >
      <View style={styles.skillInfo}>
        <Text style={[styles.skillName, selectedSkill?.id === item.id && styles.selectedSkillName]}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.skillDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      {selectedSkill?.id === item.id && (
        <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.selectedText}>
          {selectedSkill?.name || placeholder}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#007AFF"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.dropdown}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search skills..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#8E8E93"
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading skills...</Text>
            </View>
          ) : filteredSkills.length > 0 ? (
            <FlatList
              data={filteredSkills}
              renderItem={renderSkillItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              nestedScrollEnabled
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No skills found</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 14,
  },
  selectedText: {
    fontSize: 15,
    color: '#000',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    maxHeight: 250,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 10,
    margin: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  list: {
    maxHeight: 180,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  selectedSkillItem: {
    backgroundColor: '#F0F8FF',
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  selectedSkillName: {
    color: '#007AFF',
    fontWeight: '600',
  },
  skillDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default SkillSelector;
