export interface Report {
  id: string
  title: string
  uploadedDate: string
  uploadedBy: 'Doctor' | 'Patient'
  type: 'PDF' | 'Image'
  fileUrl: string
  notes?: string
}

// Backend Report interface to match the Java model
export interface BackendReport {
  id: number
  fileName: string
  cloudinaryUrl: string
  cloudinaryPublicId: string
  fileType: 'IMAGE' | 'PDF' | 'OTHER'
  uploadDate: string
  user: {
    id: number
    email: string
    name: string
  }
}

export interface Medicine {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string
  totalQuantity: number
  remainingQuantity: number
  isLowStock: boolean
}

export interface Reminder {
  id: string
  medicineId: string
  medicineName: string
  time: string
  status: 'pending' | 'taken' | 'missed'
  date: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'medicine' | 'reminder' | 'report' | 'system'
  isRead: boolean
  createdAt: string
}

export const mockReports: Report[] = [
  {
    id: '1',
    title: 'Blood Test Results - Complete Blood Count',
    uploadedDate: '2024-01-15',
    uploadedBy: 'Doctor',
    type: 'PDF',
    fileUrl: '/mock-files/blood-test.pdf',
    notes: 'All values within normal range'
  },
  {
    id: '2',
    title: 'X-Ray Chest Report',
    uploadedDate: '2024-01-10',
    uploadedBy: 'Doctor',
    type: 'Image',
    fileUrl: '/mock-files/xray-chest.jpg',
    notes: 'No abnormalities detected'
  },
  {
    id: '3',
    title: 'Prescription - Hypertension Medication',
    uploadedDate: '2024-01-08',
    uploadedBy: 'Patient',
    type: 'PDF',
    fileUrl: '/mock-files/prescription.pdf'
  },
  {
    id: '4',
    title: 'MRI Brain Scan',
    uploadedDate: '2024-01-05',
    uploadedBy: 'Doctor',
    type: 'PDF',
    fileUrl: '/mock-files/mri-brain.pdf',
    notes: 'Follow-up required in 3 months'
  }
]

export const mockMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    startDate: '2024-01-01',
    endDate: '2024-03-01',
    totalQuantity: 60,
    remainingQuantity: 45,
    isLowStock: false
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    startDate: '2024-01-01',
    endDate: '2024-06-01',
    totalQuantity: 120,
    remainingQuantity: 8,
    isLowStock: true
  },
  {
    id: '3',
    name: 'Vitamin D3',
    dosage: '1000 IU',
    frequency: 'Once daily',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    totalQuantity: 365,
    remainingQuantity: 320,
    isLowStock: false
  },
  {
    id: '4',
    name: 'Aspirin',
    dosage: '81mg',
    frequency: 'Once daily',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    totalQuantity: 365,
    remainingQuantity: 15,
    isLowStock: true
  }
]

export const mockReminders: Reminder[] = [
  {
    id: '1',
    medicineId: '1',
    medicineName: 'Lisinopril',
    time: '08:00',
    status: 'pending',
    date: '2024-01-20'
  },
  {
    id: '2',
    medicineId: '2',
    medicineName: 'Metformin',
    time: '08:00',
    status: 'taken',
    date: '2024-01-20'
  },
  {
    id: '3',
    medicineId: '2',
    medicineName: 'Metformin',
    time: '20:00',
    status: 'pending',
    date: '2024-01-20'
  },
  {
    id: '4',
    medicineId: '3',
    medicineName: 'Vitamin D3',
    time: '09:00',
    status: 'missed',
    date: '2024-01-19'
  }
]

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Medicine Running Low',
    message: 'Metformin is running low. Only 8 tablets remaining.',
    type: 'medicine',
    isRead: false,
    createdAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    title: 'Reminder Alert',
    message: 'Time to take your Lisinopril (10mg)',
    type: 'reminder',
    isRead: false,
    createdAt: '2024-01-20T08:00:00Z'
  },
  {
    id: '3',
    title: 'New Report Uploaded',
    message: 'Blood Test Results have been uploaded by Dr. Smith',
    type: 'report',
    isRead: true,
    createdAt: '2024-01-15T14:20:00Z'
  },
  {
    id: '4',
    title: 'Medicine Running Low',
    message: 'Aspirin is running low. Only 15 tablets remaining.',
    type: 'medicine',
    isRead: false,
    createdAt: '2024-01-18T16:45:00Z'
  }
]