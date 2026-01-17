import { useRouter } from 'expo-router';
import {
  Plus,
  Home,
  Brain,
  FolderKanban,
  Clock,
  Trophy,
  Target,
} from 'lucide-react-native';
import { format } from 'date-fns';
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useProjects } from '@/contexts/ProjectContext';
import type { Project } from '@/types/project';
import { BottomNavBar } from '@/components/BottomNavBar';

const { width } = Dimensions.get('window');
const PADDING = 20;
const GAP = 16;
const COLUMN_WIDTH = (width - (PADDING * 2) - GAP) / 2;

function ProjectCard({
  project,
  progress,
  onPress
}: {
  project: Project;
  progress: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: project.color + '15' }]}>
            <Text style={styles.icon}>{project.icon}</Text>
          </View>
          <View style={styles.progressRing}>
            <View style={[styles.progressDot, {
              backgroundColor: progress === 100 ? project.color : '#E5E5EA'
            }]} />
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{project.name}</Text>
          <Text style={styles.cardSubtitle}>
            {project.tasks.filter(t => t.completed).length}/{project.tasks.length} tasks
          </Text>
          {project.deadline && (
            <View style={styles.deadlineBadge}>
              <Clock size={12} color="#8E8E93" />
              <Text style={styles.deadlineText}>{format(new Date(project.deadline), 'MMM d')}</Text>
            </View>
          )}
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
                backgroundColor: project.color
              }
            ]}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function CompletedRow({
  project,
  onPress
}: {
  project: Project;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.completedRow}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <View style={[styles.completedIconContainer, { backgroundColor: project.color + '15' }]}>
        <Text style={styles.completedIcon}>{project.icon}</Text>
      </View>
      <View style={styles.completedInfo}>
        <Text style={styles.completedTitle} numberOfLines={1}>{project.name}</Text>
        <Text style={styles.completedSubtitle}>Completed</Text>
      </View>
      <View style={styles.completedBadge}>
        <Trophy size={14} color="#FFD60A" fill="#FFD60A" />
      </View>
    </Pressable>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeProjects, completedProjects, getProjectProgress } = useProjects();

  const goals = activeProjects.filter(p => p.type === 'goal');
  const projects = activeProjects.filter(p => p.type !== 'goal');

  // Clean, minimal layout
  // We want to emphasize the content and the progress

  const handleAddProject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add-project');
  };

  const handleProjectPress = (id: string) => {
    router.push(`/project/${id}` as const);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Overview</Text>
        <Pressable
          style={styles.headerButton}
          onPress={handleAddProject}
          hitSlop={10}
        >
          <Plus size={26} color="#000" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeProjects.length === 0 && completedProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Target size={48} color="#C7C7CC" strokeWidth={1} />
            </View>
            <Text style={styles.emptyTitle}>No Projects or Goals</Text>
            <Text style={styles.emptyText}>
              Create a project or goal to start tracking your big ideas.
            </Text>
            <Pressable style={styles.createButton} onPress={handleAddProject}>
              <Plus size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create New</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Active Projects Grid */}
            {/* Goals Section */}
            {goals.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Target size={20} color="#000" />
                  <Text style={styles.sectionTitle}>Goals</Text>
                </View>
                <View style={styles.gridContainer}>
                  {goals.map((project) => (
                    <View key={project.id} style={styles.gridItem}>
                      <ProjectCard
                        project={project}
                        progress={getProjectProgress(project)}
                        onPress={() => handleProjectPress(project.id)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Projects Section */}
            {projects.length > 0 && (
              <View style={[styles.section, goals.length > 0 && { marginTop: 32 }]}>
                <View style={styles.sectionHeader}>
                  <FolderKanban size={20} color="#000" />
                  <Text style={styles.sectionTitle}>Projects</Text>
                </View>
                <View style={styles.gridContainer}>
                  {projects.map((project) => (
                    <View key={project.id} style={styles.gridItem}>
                      <ProjectCard
                        project={project}
                        progress={getProjectProgress(project)}
                        onPress={() => handleProjectPress(project.id)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Completed Projects Section */}
            {completedProjects.length > 0 && (
              <View style={styles.completedSection}>
                <Text style={styles.sectionTitle}>Done</Text>
                <View style={styles.completedList}>
                  {completedProjects.map((project) => (
                    <CompletedRow
                      key={project.id}
                      project={project}
                      onPress={() => handleProjectPress(project.id)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar onFabPress={handleAddProject} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS System Gray 6
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PADDING,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  gridItem: {
    width: COLUMN_WIDTH,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    height: 160,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  progressRing: {
    padding: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#F2F2F7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deadlineText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  // Completed Section
  completedSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  completedList: {
    gap: 12,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  completedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedIcon: {
    fontSize: 20,
  },
  completedInfo: {
    flex: 1,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  completedSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF9E6', // Light yellow
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 240,
    marginBottom: 32,
    lineHeight: 22,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  bottomTab: {
    padding: 8,
  },
  bottomTabActive: {
    opacity: 1,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
});
