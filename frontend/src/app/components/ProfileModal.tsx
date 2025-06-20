import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import Modal from "react-modal"
import { UserIcon } from "lucide-react"

interface ProfileModalProps {
  isOpen: boolean
  onRequestClose: () => void
  userEmail: string | null
  subjectsCount: number
  handleLogout: () => void
  router: any
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

export default function ProfileModal({
  isOpen,
  onRequestClose,
  userEmail,
  subjectsCount,
  handleLogout,
  router,
}: ProfileModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onRequestClose={onRequestClose}
          contentLabel="프로필"
          className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl border border-gray-100"
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          ariaHideApp={false}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4"
            >
              <UserIcon className="h-10 w-10 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold mb-1 text-gray-900">{userEmail || "사용자"}</h2>
            <p className="text-gray-500 mb-6">컴퓨터공학과 • 3학년</p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3 text-left"
            >
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">등록된 과목</div>
                <div className="font-semibold">{subjectsCount}개</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">이메일</div>
                <div className="font-semibold text-sm">{userEmail || "-"}</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 space-y-2"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onRequestClose()
                  router.push("/settings")
                }}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                설정
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
              >
                로그아웃
              </motion.button>
            </motion.div>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  )
} 