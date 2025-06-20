import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import Modal from "react-modal"
import { Plus } from "lucide-react"

interface SubjectModalProps {
  isOpen: boolean
  onRequestClose: () => void
  onSubmit: (e: React.FormEvent) => void
  form: any
  setForm: (form: any) => void
  editId: number | null
  isLoading: boolean
  timeOptions: string[]
  timeError: string
  resetForm: () => void
  DAYS_OF_WEEK: ReadonlyArray<{ value: string; label: string }>
  handleStartTimeChange: (value: string) => void
}

const modalVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
}

export default function SubjectModal({
  isOpen,
  onRequestClose,
  onSubmit,
  form,
  setForm,
  editId,
  isLoading,
  timeOptions,
  timeError,
  resetForm,
  DAYS_OF_WEEK,
  handleStartTimeChange,
}: SubjectModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onRequestClose={onRequestClose}
          contentLabel="과목 추가/수정"
          className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl border border-gray-100"
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          ariaHideApp={false}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editId ? "과목 수정" : "과목 추가"}</h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRequestClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                ✕
              </motion.button>
            </div>
            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">과목명</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  maxLength={30}
                  placeholder="과목명을 입력하세요"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-3"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">요일</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={form.dayofweek}
                    onChange={e => setForm({ ...form, dayofweek: e.target.value })}
                    required
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시작</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={form.starttime}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    required
                  >
                    <option value="">선택</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">종료</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={form.endtime}
                    onChange={e => setForm({ ...form, endtime: e.target.value })}
                    required
                  >
                    <option value="">선택</option>
                    {timeOptions.map((time, idx) =>
                      idx > timeOptions.findIndex(t => t === form.starttime) ? (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ) : null
                    )}
                  </select>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center"
              >
                <input
                  id="required"
                  type="checkbox"
                  checked={form.required}
                  onChange={e => setForm({ ...form, required: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                  필수 과목으로 설정
                </label>
              </motion.div>
              <AnimatePresence>
                {timeError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-red-700 text-sm">{timeError}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3 pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onRequestClose}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  취소
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "저장 중..." : editId ? "수정" : "추가"}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  )
} 