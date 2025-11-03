import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Search, 
  Eye, 
  Download, 
  FileText,
  Image as ImageIcon,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Layout } from '../components/ui/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Modal } from '../components/ui/modal'
import { BackendReport } from '../data/mockData'
import ReportUpload from '../components/ReportUpload'
import { useAuth } from '../contexts/AuthContext'

const Reports: React.FC = () => {
  const { user, getUserReports } = useAuth()
  const [reports, setReports] = useState<BackendReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'IMAGE' | 'PDF'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [error, setError] = useState('')

  // Load reports on component mount
  useEffect(() => {
    loadReports()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadReports = async () => {
    if (!user) return

    setIsLoading(true)
    setError('')

    try {
      // Use the AuthContext method which handles user ID resolution
      const result = await getUserReports()

      if (result.success && result.data) {
        setReports(result.data)
      } else {
        setError(result.message || 'Failed to load reports')
        // Fallback to empty array if API fails
        setReports([])
      }
    } catch (error) {
      console.error('Error loading reports:', error)
      setError('Network error while loading reports')
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterBy === 'all' || report.fileType === filterBy
    return matchesSearch && matchesFilter
  })

  const handleUploadSuccess = (newReport: any) => {
    // Add the new report to the list
    setReports(prev => [newReport, ...prev])
    setShowUploadModal(false)
  }

  const handleViewReport = async (report: BackendReport) => {
    try {
      // For PDFs, we need to handle them specially to ensure proper viewing
      if (report.fileType === 'PDF') {
        // Fetch the PDF as a blob and create a blob URL for proper viewing
        const response = await fetch(report.cloudinaryUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch PDF')
        }
        
        const arrayBuffer = await response.arrayBuffer()
        // Create blob with explicit PDF MIME type
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
        const blobUrl = URL.createObjectURL(blob)
        
        // Open the blob URL in a new tab
        const newWindow = window.open(blobUrl, '_blank')
        
        // Clean up the blob URL after a delay to allow the browser to load it
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl)
        }, 1000)
        
        // If window didn't open, fallback to direct URL
        if (!newWindow) {
          window.open(report.cloudinaryUrl, '_blank')
        }
      } else {
        // For images, direct URL should work fine
        window.open(report.cloudinaryUrl, '_blank')
      }
    } catch (error) {
      console.error('Error viewing file:', error)
      // Fallback to direct URL if blob method fails
      window.open(report.cloudinaryUrl, '_blank')
    }
  }

  const handleDownloadReport = async (report: BackendReport) => {
    try {
      // Fetch the file as a blob to ensure proper binary handling
      const response = await fetch(report.cloudinaryUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch file')
      }
      
      const arrayBuffer = await response.arrayBuffer()
      
      // Create blob with explicit MIME type based on file type
      let mimeType = 'application/octet-stream' // Default binary type
      if (report.fileType === 'PDF') {
        mimeType = 'application/pdf'
      } else if (report.fileType === 'IMAGE') {
        // Try to determine image type from filename or use generic image type
        const extension = report.fileName.toLowerCase().split('.').pop()
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg'
            break
          case 'png':
            mimeType = 'image/png'
            break
          case 'gif':
            mimeType = 'image/gif'
            break
          case 'webp':
            mimeType = 'image/webp'
            break
          default:
            mimeType = 'image/jpeg' // Default to JPEG for images
        }
      }
      
      const blob = new Blob([arrayBuffer], { type: mimeType })
      
      // Create a blob URL and download link
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = report.fileName
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Error downloading file:', error)
      // Fallback to direct link if fetch fails
      window.open(report.cloudinaryUrl, '_blank')
    }
  }

  const getFileIcon = (type: 'IMAGE' | 'PDF' | 'OTHER') => {
    return type === 'PDF' ? FileText : ImageIcon
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getFileTypeDisplay = (type: 'IMAGE' | 'PDF' | 'OTHER') => {
    switch (type) {
      case 'IMAGE': return 'Image'
      case 'PDF': return 'PDF'
      default: return 'Other'
    }
  }

  const getFileTypeBadgeVariant = (type: 'IMAGE' | 'PDF' | 'OTHER') => {
    switch (type) {
      case 'PDF': return 'default'
      case 'IMAGE': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 p-6"
        >
          {/* Enhanced Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-purple-900 to-indigo-900 p-8 text-white shadow-2xl border border-slate-700/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-400/5 to-purple-400/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                  >
                    <FileText className="w-8 h-8 text-blue-200" />
                  </motion.div>
                  <div>
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="text-4xl font-bold flex items-center gap-3"
                    >
                      Medical Reports
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      >
                        📄
                      </motion.div>
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="text-slate-200 mt-2 text-lg"
                    >
                      Manage and view your medical documents securely
                    </motion.p>
                    {/* Debug info */}

                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outline" 
                      onClick={loadReports}
                      disabled={isLoading}
                      className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-sm border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-all duration-200"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      Upload Report
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-1">Total Reports</p>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="text-3xl font-bold text-white"
                    >
                      {reports.length}
                    </motion.p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg"
                  >
                    <FileText className="w-6 h-6 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-300 mb-1">PDF Files</p>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="text-3xl font-bold text-white"
                    >
                      {reports.filter(r => r.fileType === 'PDF').length}
                    </motion.p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-300 mb-1">Images</p>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="text-3xl font-bold text-white"
                    >
                      {reports.filter(r => r.fileType === 'IMAGE').length}
                    </motion.p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="relative overflow-hidden border border-slate-700/50 shadow-lg bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full -translate-y-10 translate-x-10"></div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-300 mb-1">This Month</p>
                    <motion.p 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                      className="text-3xl font-bold text-white"
                    >
                      {reports.filter(r => {
                        const reportDate = new Date(r.uploadDate)
                        const now = new Date()
                        return reportDate.getMonth() === now.getMonth() && 
                               reportDate.getFullYear() === now.getFullYear()
                      }).length}
                    </motion.p>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Enhanced Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border border-slate-700/50 shadow-xl bg-gradient-to-br from-slate-800/80 via-slate-900/30 to-slate-800/20 overflow-hidden backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant={filterBy === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterBy('all')}
                      size="sm"
                      className={filterBy === 'all' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }
                    >
                      All
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant={filterBy === 'PDF' ? 'default' : 'outline'}
                      onClick={() => setFilterBy('PDF')}
                      size="sm"
                      className={filterBy === 'PDF' 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                        : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }
                    >
                      PDF
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant={filterBy === 'IMAGE' ? 'default' : 'outline'}
                      onClick={() => setFilterBy('IMAGE')}
                      size="sm"
                      className={filterBy === 'IMAGE' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                        : 'bg-slate-800/60 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }
                    >
                      Images
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Message */}
        {error && (
          <Card variant="elevated" className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border border-slate-700/50 shadow-xl bg-gradient-to-br from-slate-800/80 via-slate-900/30 to-slate-800/20 overflow-hidden backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-xl">Reports List</CardTitle>
              <CardDescription className="text-slate-400">
                {isLoading ? 'Loading reports...' : `${filteredReports.length} report${filteredReports.length !== 1 ? 's' : ''} found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading reports...</span>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No reports found</p>
                <p className="text-sm text-muted-foreground">
                  {reports.length === 0 
                    ? "Upload your first medical report to get started" 
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const FileIcon = getFileIcon(report.fileType)
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-lg">
                              <FileIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{report.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                Uploaded by {report.user?.name || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getFileTypeBadgeVariant(report.fileType)}>
                            {getFileTypeDisplay(report.fileType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(report.uploadDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewReport(report)}
                              title="View report"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadReport(report)}
                              title="Download report"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upload Modal */}
        <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)}>
          <ReportUpload 
            onUploadSuccess={handleUploadSuccess}
            onClose={() => setShowUploadModal(false)}
          />
        </Modal>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Reports