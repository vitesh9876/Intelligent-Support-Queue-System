import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform } from 'react-native';
import io from 'socket.io-client';

// Use your computer's exact Local IP so the physical phone can talk to your laptop!
const BACKEND_URL = 'http://10.6.208.217:5000';
const socket = io(BACKEND_URL);

export default function App() {
  const [customerId, setCustomerId] = useState('');
  const [ticketType, setTicketType] = useState('Billing');
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.on('queue_update', (queue) => {
      if (inQueue && customerId) {
        const index = queue.findIndex(t => t.customerId === customerId);
        if (index !== -1) {
          setQueuePosition(index + 1);
          setTicketInfo(queue[index]);
        } else {
          // Check if resolved or processing
          checkTicketStatus(customerId);
        }
      }
    });

    socket.on('notification', (data) => {
      Alert.alert('Notification', data.message);
      if (data.message.includes('removed')) {
        setInQueue(false);
        setQueuePosition(null);
        setTicketInfo(null);
      }
    });

    // Heartbeat mechanism
    const heartbeatInterval = setInterval(() => {
      if (inQueue && customerId) {
        socket.emit('heartbeat', customerId);
      }
    }, 30000); // every 30s

    return () => {
      socket.off('queue_update');
      socket.off('notification');
      clearInterval(heartbeatInterval);
    };
  }, [inQueue, customerId]);

  const checkTicketStatus = async (cid) => {
    // Basic polling or emit event could be used. 
    // If they aren't in the 'waiting' queue anymore, maybe they are being processed.
  };

  const handleJoinQueue = async () => {
    if (!customerId.trim()) return;
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId,
          type: ticketType
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setInQueue(true);
        socket.emit('join_customer', customerId);
      } else {
        Alert.alert('Error', data.error || 'Failed to join queue');
      }
    } catch (e) {
      Alert.alert('Connection Error', 'Could not connect to the backend server');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Support</Text>
        <Text style={styles.subtitle}>Intelligent Queue System</Text>
      </View>

      {!inQueue ? (
        <View style={styles.card}>
          <Text style={styles.label}>Enter your Customer ID</Text>
          <TextInput
            style={styles.input}
            value={customerId}
            onChangeText={setCustomerId}
            placeholder="e.g. CUST-1234"
            placeholderTextColor="#94a3b8"
          />
          
          <Text style={styles.label}>Select Department</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.typeButton, ticketType === 'Billing' && styles.typeButtonActive]}
              onPress={() => setTicketType('Billing')}
            >
              <Text style={[styles.typeText, ticketType === 'Billing' && styles.typeTextActive]}>Billing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.typeButton, ticketType === 'Technical' && styles.typeButtonActive]}
              onPress={() => setTicketType('Technical')}
            >
              <Text style={[styles.typeText, ticketType === 'Technical' && styles.typeTextActive]}>Technical</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.joinButton} onPress={handleJoinQueue} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.joinButtonText}>Join Queue</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.statusTitle}>You are in the queue</Text>
          
          <View style={styles.positionCircle}>
            <Text style={styles.positionText}>#{queuePosition || '...'}</Text>
          </View>
          
          {ticketInfo && (
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ticket ID:</Text>
                <Text style={styles.detailValue}>{ticketInfo._id.substring(0, 8)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Department:</Text>
                <Text style={styles.detailValue}>{ticketInfo.type}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Priority Score:</Text>
                <Text style={styles.detailValue}>{ticketInfo.currentPriority?.toFixed(1)}</Text>
              </View>
            </View>
          )}

          <Text style={styles.infoText}>
            Keep this app open. We will automatically maintain your active status. If you close the app for more than 2 minutes, you will be removed from the queue.
          </Text>
          
          <TouchableOpacity 
            style={[styles.joinButton, { backgroundColor: '#ef4444', marginTop: 20 }]} 
            onPress={() => {
               setInQueue(false);
               // could implement a cancel endpoint here
            }}
          >
            <Text style={styles.joinButtonText}>Leave Queue</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    margin: 24,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 16,
    color: '#f8fafc',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#ffffff',
  },
  joinButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 24,
  },
  positionCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0f172a',
    borderWidth: 4,
    borderColor: '#3b82f6',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  positionText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  detailsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#94a3b8',
  },
  detailValue: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  }
});
