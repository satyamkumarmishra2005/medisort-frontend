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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Medical Reports</h1>
            <p className="text-muted-foreground">Manage and view your medical documents</p>
            {/* Debug info */}
            {user && (
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                Debug: User ID: {user.id} (type: {typeof user.id}), Email: {user.email}, Name: {user.name}
                <br />
                Token: {localStorage.getItem('medisort_token') ? 'Present' : 'Missing'}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadReports}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="healthcare-gradient" 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Upload Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold text-foreground">{reports.length}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PDF Files</p>
                  <p className="text-2xl font-bold text-foreground">
                    {reports.filter(r => r.fileType === 'PDF').length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Images</p>
                  <p className="text-2xl font-bold text-foreground">
                    {reports.filter(r => r.fileType === 'IMAGE').length}
                  </p>
                </div>
                <ImageIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-foreground">
                    {reports.filter(r => {
                      const reportDate = new Date(r.uploadDate)
                      const now = new Date()
                      return reportDate.getMonth() === now.getMonth() && 
                             reportDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
                <Upload className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterBy === 'all' ? 'healthcare' : 'outline'}
                  onClick={() => setFilterBy('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterBy === 'PDF' ? 'healthcare' : 'outline'}
                  onClick={() => setFilterBy('PDF')}
                  size="sm"
                >
                  PDF
                </Button>
                <Button
                  variant={filterBy === 'IMAGE' ? 'healthcare' : 'outline'}
                  onClick={() => setFilterBy('IMAGE')}
                  size="sm"
                >
                  Images
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card variant="elevated" className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Reports Table */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Reports List</CardTitle>
            <CardDescription>
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

        {/* Upload Modal */}
        <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)}>
          <ReportUpload 
            onUploadSuccess={handleUploadSuccess}
            onClose={() => setShowUploadModal(false)}
          />
        </Modal>
      </motion.div>
    </Layout>
  )
}

export default Reports