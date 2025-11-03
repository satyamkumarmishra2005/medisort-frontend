import React from 'react'
import { motion } from 'framer-motion'
import { Layout } from '../components/ui/layout'
import { MedicineReminders } from '../components/MedicineReminders'

const Reminders: React.FC = () => {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <MedicineReminders />
      </motion.div>
    </Layout>
  )
}

export default Reminders