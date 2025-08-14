// useWidgetMemoryStore.ts
// Widget-specific memory and context management for AIDA intelligent widgets
// Bridge layer between individual widgets and the MAIA memory system

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';

// Import UI store for notifications
import { useUIStore, TOAST_TYPES, createToast } from './useUIStore';
// *** NEW: Import the central MAIA store ***
import { useMAIAStore } from './useMAIAStore';

// Memory store persistence configuration
const memoryPersistConfig = {
  name: 'aida-widget-memory',
  storage: createJSONStorage(() => localStorage),
  version: 1,
  
  // Persist memory data with size limits
  partialize: (state) => ({
    // Widget-specific memories (limited to last 100 per widget)
    widgetMemories: Object.fromEntries(
      Object.entries(state.widgetMemories).map(([widgetId, memories]) => [
        widgetId, 
        memories.slice(0, 100) // Keep only last 100 memories per widget
      ])
    ),
    
    // Operator feedback patterns (limited to last 500)
    feedbackHistory: state.feedbackHistory.slice(0, 500),
    
    // Widget-specific confidence adjustments
    confidenceAdjustments: state.confidenceAdjustments,
    
    // Alert suppression rules
    suppressionRules: state.suppressionRules,
    
    // Cross-widget correlation data
    correlationData: state.correlationData,
    
    // Metadata
    memoryVersion: 1,
    lastSaved: Date.now()
  }),
  
  // Post-rehydration cleanup
  onRehydrateStorage: () => (state, error) => {
    if (error) {
      console.error('Widget memory rehydration failed:', error);
      return;
    }
    
    if (state) {
      console.log('Widget memory rehydrated successfully');
      
      // Clean old memories on startup
      state.performMemoryMaintenance?.(true); // silent cleanup
    }
  }
};

/**
 * Widget Memory Store - Manages contextual memory and learning for intelligent widgets
 * * Responsibilities:
 * - Store and retrieve widget-specific contextual memories
 * - Track operator feedback patterns for confidence adjustment
 * - Manage alert suppression rules and quiet periods
 * - Coordinate cross-widget insights and correlations
 * - Bridge to MAIA memory system when available
 */
export const useWidgetMemoryStore = create(
  persist(
    (set, get) => ({
      // === STATE PROPERTIES ===
      
      // Widget-specific memory storage
      widgetMemories: {}, // { widgetId: [{ timestamp, event, context, outcome }] }
      
      // Operator feedback tracking
      feedbackHistory: [], // [{ widgetId, feedback, timestamp, context }]
      operatorProfiles: {}, // { operatorId: { preferences, trust_calibration } }
      
      // Confidence scoring adjustments
      confidenceAdjustments: {}, // { widgetId: { factor, reason, lastUpdated } }
      
      // Alert suppression and quiet rules
      suppressionRules: [], // [{ pattern, widgetId, until, reason, operator }]
      quietPeriods: {}, // { widgetId: { start, end, reason } }
      
      // Cross-widget correlation data
      correlationData: {}, // { pattern: [{ widgets, timestamp, strength }] }
      
      // MAIA integration state
      maiaAvailable: false,
      maiaLastSync: null,
      pendingQueries: [], // Queries waiting for MAIA
      
      // Performance tracking
      memoryOperations: {
        queries: 0,
        inserts: 0,
        updates: 0,
        lastActivity: null
      },
      
      // === MEMORY STORAGE ACTIONS ===
      
      /**
       * Store a memory event for a specific widget
       * @param {string} widgetId - Widget identifier
       * @param {Object} memoryEvent - Memory event data
       * @param {string} memoryEvent.type - Event type ('alert', 'threshold', 'insight', 'operator_action')
       * @param {Object} memoryEvent.context - Contextual data (metrics, state, etc.)
       * @param {string} [memoryEvent.description] - Human-readable description
       * @param {Object} [memoryEvent.metadata] - Additional metadata
       */
      storeMemory: (widgetId, memoryEvent) => {
        if (!widgetId || !memoryEvent) {
          console.warn('Invalid parameters for storeMemory');
          return;
        }
        
        const now = Date.now();
        const memory = {
          id: `${widgetId}-${now}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          type: memoryEvent.type || 'generic',
          context: memoryEvent.context || {},
          description: memoryEvent.description || '',
          metadata: memoryEvent.metadata || {},
          confidence: memoryEvent.confidence || null,
          outcome: null, // Will be filled later when outcome is known
          tags: memoryEvent.tags || []
        };
        
        set(produce(draft => {
          if (!draft.widgetMemories[widgetId]) {
            draft.widgetMemories[widgetId] = [];
          }
          
          // Add new memory
          draft.widgetMemories[widgetId].unshift(memory);
          
          // Keep only last 200 memories per widget (trim excess)
          if (draft.widgetMemories[widgetId].length > 200) {
            draft.widgetMemories[widgetId] = draft.widgetMemories[widgetId].slice(0, 200);
          }
          
          // Update performance metrics
          draft.memoryOperations.inserts++;
          draft.memoryOperations.lastActivity = now;
        }));
        
        // If MAIA is available, sync the memory
        if (get().maiaAvailable) {
          get().syncMemoryToMAIA(widgetId, memory);
        }
        
        return memory.id;
      },
      
      /**
       * Update a memory with outcome information
       * @param {string} widgetId - Widget identifier  
       * @param {string} memoryId - Memory ID to update
       * @param {Object} outcome - Outcome data
       */
      updateMemoryOutcome: (widgetId, memoryId, outcome) => {
        set(produce(draft => {
          const memories = draft.widgetMemories[widgetId];
          if (memories) {
            const memory = memories.find(m => m.id === memoryId);
            if (memory) {
              memory.outcome = {
                ...outcome,
                resolvedAt: Date.now()
              };
              
              draft.memoryOperations.updates++;
              draft.memoryOperations.lastActivity = Date.now();
            }
          }
        }));
      },
      
      /**
       * Query widget memories with filtering and similarity matching
       * @param {string} widgetId - Widget identifier
       * @param {Object} query - Query parameters
       * @param {string} [query.type] - Filter by memory type
       * @param {Object} [query.similarContext] - Find memories with similar context
       * @param {number} [query.limit] - Maximum results (default: 10)
       * @param {number} [query.maxAge] - Maximum age in milliseconds
       * @returns {Array} Matching memories
       */
      queryMemories: (widgetId, query = {}) => {
        const state = get();
        
        set(produce(draft => {
          draft.memoryOperations.queries++;
          draft.memoryOperations.lastActivity = Date.now();
        }));
        
        const memories = state.widgetMemories[widgetId] || [];
        let results = [...memories];
        
        // Filter by type
        if (query.type) {
          results = results.filter(memory => memory.type === query.type);
        }
        
        // Filter by max age
        if (query.maxAge) {
          const cutoff = Date.now() - query.maxAge;
          results = results.filter(memory => memory.timestamp > cutoff);
        }
        
        // Filter by tags
        if (query.tags && query.tags.length > 0) {
          results = results.filter(memory => 
            query.tags.some(tag => memory.tags.includes(tag))
          );
        }
        
        // Simple similarity matching for context
        if (query.similarContext) {
          results = results.map(memory => ({
            ...memory,
            similarity: get().calculateContextSimilarity(query.similarContext, memory.context)
          }))
          .filter(memory => memory.similarity > 0.3) // Minimum similarity threshold
          .sort((a, b) => b.similarity - a.similarity);
        }
        
        // Apply limit
        const limit = query.limit || 10;
        results = results.slice(0, limit);
        
        return results;
      },
      
      /**
       * Get the latest insight or alert for a specific widget
       * @param {string} widgetId - Widget identifier
       * @returns {Object|null} Latest insight/alert memory or null if none found
       */
      getLatestInsightForWidget: (widgetId) => {
        const state = get();
        const memories = state.widgetMemories[widgetId] || [];
        
        // Filter for insights and alerts, then sort by timestamp (newest first)
        const insights = memories
          .filter(memory => 
            memory.type === MEMORY_EVENT_TYPES.INSIGHT || 
            memory.type === MEMORY_EVENT_TYPES.ALERT
          )
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        return insights.length > 0 ? insights[0] : null;
      },
      
      /**
       * Calculate simple similarity between two context objects
       * @param {Object} context1 - First context
       * @param {Object} context2 - Second context  
       * @returns {number} Similarity score (0-1)
       */
      calculateContextSimilarity: (context1, context2) => {
        if (!context1 || !context2) return 0;
        
        const keys1 = Object.keys(context1);
        const keys2 = Object.keys(context2);
        const commonKeys = keys1.filter(key => keys2.includes(key));
        
        if (commonKeys.length === 0) return 0;
        
        let similarity = 0;
        commonKeys.forEach(key => {
          const val1 = context1[key];
          const val2 = context2[key];
          
          if (typeof val1 === 'number' && typeof val2 === 'number') {
            // Numeric similarity (closer values = higher similarity)
            const diff = Math.abs(val1 - val2);
            const max = Math.max(Math.abs(val1), Math.abs(val2), 1);
            similarity += 1 - (diff / max);
          } else if (val1 === val2) {
            // Exact match
            similarity += 1;
          } else if (typeof val1 === 'string' && typeof val2 === 'string') {
            // String similarity (simple substring check)
            if (val1.toLowerCase().includes(val2.toLowerCase()) || 
                val2.toLowerCase().includes(val1.toLowerCase())) {
              similarity += 0.5;
            }
          }
        });
        
        return similarity / commonKeys.length;
      },
      
      // === OPERATOR FEEDBACK TRACKING ===
      
      /**
       * Record operator feedback for confidence adjustment
       * @param {string} widgetId - Widget identifier
       * @param {string} feedback - Feedback type ('helpful', 'ignore', 'snooze', 'never')
       * @param {Object} context - Context when feedback was given
       * @param {string} [operatorId] - Operator identifier
       */
      recordFeedback: (widgetId, feedback, context, operatorId = 'default') => {
        const now = Date.now();
        const feedbackEvent = {
          id: `feedback-${now}-${Math.random().toString(36).substr(2, 9)}`,
          widgetId,
          feedback,
          context: context || {},
          operatorId,
          timestamp: now
        };
        
        set(produce(draft => {
          // Store feedback event
          draft.feedbackHistory.unshift(feedbackEvent);
          
          // Keep only last 1000 feedback events
          if (draft.feedbackHistory.length > 1000) {
            draft.feedbackHistory = draft.feedbackHistory.slice(0, 1000);
          }
          
          // Update operator profile
          if (!draft.operatorProfiles[operatorId]) {
            draft.operatorProfiles[operatorId] = {
              totalFeedback: 0,
              feedbackCounts: {},
              trustScore: 0.5, // Start neutral
              lastActivity: now
            };
          }
          
          const profile = draft.operatorProfiles[operatorId];
          profile.totalFeedback++;
          profile.feedbackCounts[feedback] = (profile.feedbackCounts[feedback] || 0) + 1;
          profile.lastActivity = now;
          
          // Recalculate trust score based on feedback patterns
          const helpful = profile.feedbackCounts.helpful || 0;
          const ignore = profile.feedbackCounts.ignore || 0;
          const never = profile.feedbackCounts.never || 0;
          const total = profile.totalFeedback;
          
          // Simple trust calculation: more helpful = higher trust, more ignores/nevers = lower trust
          profile.trustScore = Math.max(0.1, Math.min(1.0, 
            0.5 + ((helpful - ignore - (never * 2)) / total) * 0.5
          ));
          
          // Adjust widget-specific confidence based on recent feedback
          get().adjustWidgetConfidence(widgetId, feedback, operatorId);
        }));
        
        return feedbackEvent.id;
      },
      
      /**
       * Adjust widget confidence based on feedback patterns
       * @param {string} widgetId - Widget identifier
       * @param {string} latestFeedback - Most recent feedback
       * @param {string} operatorId - Operator identifier
       */
      adjustWidgetConfidence: (widgetId, latestFeedback, operatorId) => {
        const state = get();
        
        // Get recent feedback for this widget
        const recentFeedback = state.feedbackHistory
          .filter(f => f.widgetId === widgetId && f.operatorId === operatorId)
          .slice(0, 10); // Last 10 feedback events
        
        if (recentFeedback.length < 3) {
          return; // Need at least 3 feedback events to adjust
        }
        
        // Calculate adjustment factor based on feedback pattern
        let adjustment = 0;
        recentFeedback.forEach(f => {
          switch (f.feedback) {
            case 'helpful':
              adjustment += 0.05;
              break;
            case 'snooze':
              adjustment -= 0.02;
              break;
            case 'ignore':
              adjustment -= 0.05;
              break;
            case 'never':
              adjustment -= 0.10;
              break;
          }
        });
        
        // Apply adjustment with bounds
        adjustment = Math.max(-0.3, Math.min(0.3, adjustment));
        
        if (Math.abs(adjustment) > 0.01) {
          set(produce(draft => {
            draft.confidenceAdjustments[widgetId] = {
              factor: adjustment,
              reason: `Based on ${recentFeedback.length} recent feedback events`,
              lastUpdated: Date.now(),
              operatorId,
              feedbackPattern: recentFeedback.map(f => f.feedback)
            };
          }));
        }
      },
      
      /**
       * Get confidence adjustment for a widget
       * @param {string} widgetId - Widget identifier
       * @returns {number} Confidence adjustment factor (-0.3 to 0.3)
       */
      getConfidenceAdjustment: (widgetId) => {
        const state = get();
        const adjustment = state.confidenceAdjustments[widgetId];
        
        if (!adjustment) return 0;
        
        // Age out old adjustments (older than 7 days)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        if (Date.now() - adjustment.lastUpdated > maxAge) {
          return 0;
        }
        
        return adjustment.factor || 0;
      },
      
      // === ALERT SUPPRESSION MANAGEMENT ===
      
      /**
       * Add alert suppression rule
       * @param {Object} rule - Suppression rule
       * @param {string} rule.widgetId - Widget to suppress
       * @param {Object} rule.pattern - Pattern to match for suppression
       * @param {number} rule.duration - Duration in milliseconds
       * @param {string} rule.reason - Reason for suppression
       * @param {string} [rule.operatorId] - Operator who created the rule
       */
      addSuppressionRule: (rule) => {
        const now = Date.now();
        const suppressionRule = {
          id: `suppress-${now}-${Math.random().toString(36).substr(2, 9)}`,
          widgetId: rule.widgetId,
          pattern: rule.pattern || {},
          until: now + (rule.duration || 3600000), // Default 1 hour
          reason: rule.reason || 'User requested',
          operatorId: rule.operatorId || 'default',
          createdAt: now,
          active: true
        };
        
        set(produce(draft => {
          draft.suppressionRules.push(suppressionRule);
        }));
        
        // Auto-cleanup expired rules
        setTimeout(() => {
          get().cleanupExpiredSuppressions();
        }, rule.duration || 3600000);
        
        return suppressionRule.id;
      },
      
      /**
       * Check if an alert should be suppressed
       * @param {string} widgetId - Widget identifier
       * @param {Object} alertContext - Alert context to check
       * @returns {boolean} True if alert should be suppressed
       */
      shouldSuppressAlert: (widgetId, alertContext) => {
        const state = get();
        const now = Date.now();
        
        // Check active suppression rules
        const activeRules = state.suppressionRules.filter(rule => 
          rule.active && 
          rule.until > now && 
          rule.widgetId === widgetId
        );
        
        for (const rule of activeRules) {
          // Simple pattern matching (can be enhanced)
          if (get().matchesPattern(alertContext, rule.pattern)) {
            return true;
          }
        }
        
        // Check quiet periods
        const quietPeriod = state.quietPeriods[widgetId];
        if (quietPeriod && now >= quietPeriod.start && now <= quietPeriod.end) {
          return true;
        }
        
        return false;
      },
      
      /**
       * Simple pattern matching for suppression rules
       * @param {Object} context - Alert context
       * @param {Object} pattern - Pattern to match
       * @returns {boolean} True if pattern matches
       */
      matchesPattern: (context, pattern) => {
        if (!context || !pattern) return false;
        
        return Object.keys(pattern).every(key => {
          const contextValue = context[key];
          const patternValue = pattern[key];
          
          if (typeof patternValue === 'string' && patternValue.startsWith('*')) {
            // Wildcard matching
            const searchTerm = patternValue.substring(1);
            return contextValue && contextValue.toString().includes(searchTerm);
          } else {
            // Exact matching
            return contextValue === patternValue;
          }
        });
      },
      
      /**
       * Clean up expired suppression rules
       */
      cleanupExpiredSuppressions: () => {
        const now = Date.now();
        
        set(produce(draft => {
          draft.suppressionRules = draft.suppressionRules.filter(rule => 
            rule.until > now || !rule.active
          );
        }));
      },
      
      /**
       * Set quiet period for a widget
       * @param {string} widgetId - Widget identifier
       * @param {number} duration - Duration in milliseconds
       * @param {string} reason - Reason for quiet period
       */
      setQuietPeriod: (widgetId, duration, reason = 'User requested') => {
        const now = Date.now();
        
        set(produce(draft => {
          draft.quietPeriods[widgetId] = {
            start: now,
            end: now + duration,
            reason,
            createdAt: now
          };
        }));
        
        // Auto-cleanup
        setTimeout(() => {
          set(produce(draft => {
            delete draft.quietPeriods[widgetId];
          }));
        }, duration);
      },
      
      // === CROSS-WIDGET CORRELATION ===
      
      /**
       * Record correlation between widgets
       * @param {Array} widgetIds - Array of correlated widget IDs
       * @param {Object} pattern - Pattern that links them
       * @param {number} strength - Correlation strength (0-1)
       */
      recordCorrelation: (widgetIds, pattern, strength = 0.5) => {
        if (!widgetIds || widgetIds.length < 2) return;
        
        const correlationId = widgetIds.sort().join('-');
        
        set(produce(draft => {
          if (!draft.correlationData[correlationId]) {
            draft.correlationData[correlationId] = [];
          }
          
          draft.correlationData[correlationId].push({
            widgets: widgetIds,
            pattern,
            strength,
            timestamp: Date.now(),
            occurrences: 1
          });
          
          // Keep only last 50 correlations per pattern
          if (draft.correlationData[correlationId].length > 50) {
            draft.correlationData[correlationId] = draft.correlationData[correlationId].slice(0, 50);
          }
        }));
      },
      
      /**
       * Get correlated widgets for a given widget
       * @param {string} widgetId - Widget identifier
       * @param {number} minStrength - Minimum correlation strength
       * @returns {Array} Correlated widgets with strength scores
       */
      getCorrelatedWidgets: (widgetId, minStrength = 0.3) => {
        const state = get();
        const correlations = [];
        
        Object.values(state.correlationData).forEach(patterns => {
          patterns.forEach(correlation => {
            if (correlation.widgets.includes(widgetId) && correlation.strength >= minStrength) {
              const otherWidgets = correlation.widgets.filter(id => id !== widgetId);
              correlations.push({
                widgets: otherWidgets,
                strength: correlation.strength,
                pattern: correlation.pattern,
                timestamp: correlation.timestamp
              });
            }
          });
        });
        
        // Sort by strength descending
        return correlations.sort((a, b) => b.strength - a.strength);
      },
      
      // === MAIA INTEGRATION BRIDGE ===
      
      /**
       * Initialize MAIA connection.
       */
      initializeMAIA: () => {
        // *** IMPLEMENTED: Call the initialize action from the central MAIA store ***
        useMAIAStore.getState().initialize();
        
        set(produce(draft => {
          draft.maiaAvailable = true;
          draft.maiaLastSync = Date.now();
        }));
        
        console.log('MAIA integration bridge initialized.');
        
        // Process any pending queries
        const state = get();
        if (state.pendingQueries.length > 0) {
          get().processPendingQueries();
        }
      },
      
      /**
       * Sync memory to MAIA when available.
       * @param {string} widgetId - Widget identifier (for context).
       * @param {Object} memory - Memory object to sync.
       */
      syncMemoryToMAIA: (widgetId, memory) => {
        // *** IMPLEMENTED: This now calls the central MAIA store's ingest action ***
        if (get().maiaAvailable) {
          try {
            useMAIAStore.getState().ingestMemory(memory);
            set(produce(draft => { draft.maiaLastSync = Date.now(); }));
          } catch (error) {
            console.warn(`Failed to sync memory to MAIA for widget ${widgetId}:`, error);
          }
        }
      },
      
      /**
       * Query MAIA for contextual insights.
       * @param {string} widgetId - Widget identifier.
       * @param {Object} query - Query parameters.
       * @returns {Promise<Object>} MAIA response.
       */
      queryMAIA: async (widgetId, query) => {
        if (!get().maiaAvailable) {
          // Queue for later processing
          set(produce(draft => {
            draft.pendingQueries.push({ widgetId, query, timestamp: Date.now() });
          }));
          return null;
        }
        
        // *** IMPLEMENTED: This now calls the central MAIA store's analysis function ***
        try {
          console.log(`Querying MAIA for widget ${widgetId}:`, query);
          const result = useMAIAStore.getState().runConfidenceAnalysis(query);
          return result;
        } catch (error) {
          console.error(`Failed to query MAIA for widget ${widgetId}:`, error);
          return null;
        }
      },
      
      /**
       * Process pending MAIA queries.
       */
      processPendingQueries: async () => {
        const state = get();
        const pending = [...state.pendingQueries];
        
        set(produce(draft => {
          draft.pendingQueries = [];
        }));
        
        for (const query of pending) {
          try {
            await get().queryMAIA(query.widgetId, query.query);
          } catch (error) {
            console.warn('Failed to process pending MAIA query:', error);
          }
        }
      },
      
      // === MAINTENANCE AND UTILITIES ===
      
      /**
       * Perform memory maintenance and cleanup
       * @param {boolean} silent - Skip notifications
       */
      performMemoryMaintenance: (silent = false) => {
        const state = get();
        let cleaned = false;
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        set(produce(draft => {
          // Clean old memories
          Object.keys(draft.widgetMemories).forEach(widgetId => {
            const originalCount = draft.widgetMemories[widgetId].length;
            draft.widgetMemories[widgetId] = draft.widgetMemories[widgetId]
              .filter(memory => (now - memory.timestamp) < maxAge);
            
            if (draft.widgetMemories[widgetId].length !== originalCount) {
              cleaned = true;
            }
            
            // Remove empty memory arrays
            if (draft.widgetMemories[widgetId].length === 0) {
              delete draft.widgetMemories[widgetId];
              cleaned = true;
            }
          });
          
          // Clean old feedback
          const originalFeedbackCount = draft.feedbackHistory.length;
          draft.feedbackHistory = draft.feedbackHistory
            .filter(feedback => (now - feedback.timestamp) < maxAge);
          
          if (draft.feedbackHistory.length !== originalFeedbackCount) {
            cleaned = true;
          }
          
          // Clean expired suppressions
          const originalSuppressionCount = draft.suppressionRules.length;
          draft.suppressionRules = draft.suppressionRules
            .filter(rule => rule.until > now);
          
          if (draft.suppressionRules.length !== originalSuppressionCount) {
            cleaned = true;
          }
          
          // Clean old correlations
          Object.keys(draft.correlationData).forEach(patternId => {
            const originalCount = draft.correlationData[patternId].length;
            draft.correlationData[patternId] = draft.correlationData[patternId]
              .filter(correlation => (now - correlation.timestamp) < maxAge);
            
            if (draft.correlationData[patternId].length !== originalCount) {
              cleaned = true;
            }
            
            if (draft.correlationData[patternId].length === 0) {
              delete draft.correlationData[patternId];
              cleaned = true;
            }
          });
          
          // Clean old operator profiles
          Object.keys(draft.operatorProfiles).forEach(operatorId => {
            const profile = draft.operatorProfiles[operatorId];
            if ((now - profile.lastActivity) > maxAge) {
              delete draft.operatorProfiles[operatorId];
              cleaned = true;
            }
          });
        }));
        
        if (cleaned && !silent) {
          useUIStore.getState().addToast(createToast(
            TOAST_TYPES.INFO,
            'Memory Cleaned',
            'Old widget memories and data have been cleaned up'
          ));
        }
        
        return cleaned;
      },
      
      /**
       * Get memory statistics and diagnostics
       * @returns {Object} Memory statistics
       */
      getMemoryStatistics: () => {
        const state = get();
        
        // Count memories by widget
        const memoryCountsByWidget = {};
        let totalMemories = 0;
        
        Object.keys(state.widgetMemories).forEach(widgetId => {
          const count = state.widgetMemories[widgetId].length;
          memoryCountsByWidget[widgetId] = count;
          totalMemories += count;
        });
        
        // Count feedback by type
        const feedbackCounts = {};
        state.feedbackHistory.forEach(feedback => {
          feedbackCounts[feedback.feedback] = (feedbackCounts[feedback.feedback] || 0) + 1;
        });
        
        return {
          totalMemories,
          memoryCountsByWidget,
          totalFeedback: state.feedbackHistory.length,
          feedbackCounts,
          activeSuppressions: state.suppressionRules.filter(rule => 
            rule.active && rule.until > Date.now()
          ).length,
          activeQuietPeriods: Object.keys(state.quietPeriods).length,
          correlationPatterns: Object.keys(state.correlationData).length,
          operatorProfiles: Object.keys(state.operatorProfiles).length,
          memoryOperations: state.memoryOperations,
          maiaStatus: {
            available: state.maiaAvailable,
            lastSync: state.maiaLastSync,
            pendingQueries: state.pendingQueries.length
          },
          timestamp: Date.now()
        };
      },
      
      /**
       * Export memory data for backup or analysis
       * @returns {Object} Exportable memory data
       */
      exportMemoryData: () => {
        const state = get();
        
        return {
          version: 1,
          timestamp: new Date().toISOString(),
          widgetMemories: state.widgetMemories,
          feedbackHistory: state.feedbackHistory,
          operatorProfiles: state.operatorProfiles,
          confidenceAdjustments: state.confidenceAdjustments,
          suppressionRules: state.suppressionRules,
          correlationData: state.correlationData,
          statistics: get().getMemoryStatistics()
        };
      },
      
      /**
       * Reset memory store (for testing or fresh start)
       */
      resetMemoryStore: () => {
        const { showConfirmation, addToast } = useUIStore.getState();
        
        showConfirmation({
          title: 'Reset Widget Memory',
          message: 'This will permanently delete all widget memories, feedback history, and learning data. This action cannot be undone.',
          variant: 'danger',
          confirmText: 'Reset Memory',
          onConfirm: () => {
            set({
              widgetMemories: {},
              feedbackHistory: [],
              operatorProfiles: {},
              confidenceAdjustments: {},
              suppressionRules: [],
              quietPeriods: {},
              correlationData: {},
              maiaAvailable: false,
              maiaLastSync: null,
              pendingQueries: [],
              memoryOperations: {
                queries: 0,
                inserts: 0,
                updates: 0,
                lastActivity: null
              }
            });
            
            addToast(createToast(
              TOAST_TYPES.INFO,
              'Memory Reset Complete',
              'All widget memory data has been cleared'
            ));
          }
        });
      }
    }),
    memoryPersistConfig
  )
);

// === UTILITY FUNCTIONS FOR EXTERNAL USE ===

/**
 * Memory event types for consistent usage
 */
export const MEMORY_EVENT_TYPES = {
  ALERT: 'alert',
  THRESHOLD_BREACH: 'threshold_breach',
  INSIGHT: 'insight',
  OPERATOR_ACTION: 'operator_action',
  STATE_CHANGE: 'state_change',
  CORRELATION: 'correlation',
  SIMULATION: 'simulation',
  ERROR: 'error'
};

/**
 * Feedback types for operator responses
 */
export const FEEDBACK_TYPES = {
  HELPFUL: 'helpful',
  IGNORE: 'ignore', 
  SNOOZE: 'snooze',
  NEVER: 'never'
};

/**
 * Helper function to create standardized memory events
 * @param {string} type - Memory event type
 * @param {Object} context - Contextual data
 * @param {string} description - Human-readable description
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Memory event object
 */
export const createMemoryEvent = (type, context, description, metadata = {}) => ({
  type,
  context: context || {},
  description: description || '',
  metadata: {
    ...metadata,
    createdAt: new Date().toISOString()
  },
  tags: metadata.tags || []
});

/**
 * Helper function to create suppression rules
 * @param {string} widgetId - Widget identifier
 * @param {Object} pattern - Pattern to match
 * @param {number} durationHours - Duration in hours
 * @param {string} reason - Reason for suppression
 * @returns {Object} Suppression rule object
 */
export const createSuppressionRule = (widgetId, pattern, durationHours = 1, reason = 'User requested') => ({
  widgetId,
  pattern,
  duration: durationHours * 60 * 60 * 1000, // Convert to milliseconds
  reason
});

/**
 * Helper function to check if a widget has recent memories
 * @param {string} widgetId - Widget identifier
 * @param {number} maxAgeHours - Maximum age in hours (default: 24)
 * @returns {boolean} True if widget has recent memories
 */
export const hasRecentMemories = (widgetId, maxAgeHours = 24) => {
  const memories = useWidgetMemoryStore.getState().queryMemories(widgetId, {
    maxAge: maxAgeHours * 60 * 60 * 1000,
    limit: 1
  });
  return memories.length > 0;
};

/**
 * Helper function to get trust score for an operator
 * @param {string} operatorId - Operator identifier
 * @returns {number} Trust score (0-1)
 */
export const getOperatorTrustScore = (operatorId = 'default') => {
  const state = useWidgetMemoryStore.getState();
  const profile = state.operatorProfiles[operatorId];
  return profile?.trustScore || 0.5; // Default neutral trust
};

/**
 * Helper function to create feedback with context
 * @param {string} feedback - Feedback type
 * @param {Object} context - Context object
 * @param {string} operatorId - Operator identifier
 * @returns {Object} Feedback object
 */
export const createFeedback = (feedback, context, operatorId = 'default') => ({
  feedback,
  context: context || {},
  operatorId,
  timestamp: Date.now()
});

// Export the store hook as default
export default useWidgetMemoryStore;