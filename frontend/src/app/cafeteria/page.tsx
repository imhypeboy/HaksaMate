"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Utensils, Clock, MapPin, Star, Heart, DollarSign, Zap, Users } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"

interface MenuItem {
    id: string
    name: string
    price: number
    category: "main" | "side" | "soup" | "dessert" | "drink"
    calories?: number
    allergens?: string[]
    rating?: number
    isVegetarian?: boolean
    isSpicy?: boolean
    image?: string
}

interface DailyMenu {
    date: string
    breakfast: MenuItem[]
    lunch: MenuItem[]
    dinner: MenuItem[]
    specialMenu?: MenuItem[]
}

interface CafeteriaInfo {
    id: string
    name: string
    location: string
    phone: string
    operatingHours: {
        breakfast: string
        lunch: string
        dinner: string
    }
    capacity: number
    currentOccupancy: number
    rating: number
}

export default function CafeteriaPage() {
    const router = useRouter()
    const [weeklyMenu, setWeeklyMenu] = useState<DailyMenu[]>([])
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
    const [selectedMeal, setSelectedMeal] = useState<"breakfast" | "lunch" | "dinner">("lunch")
    const [selectedCafeteria, setSelectedCafeteria] = useState("main")
    const [favoriteItems, setFavoriteItems] = useState<string[]>([])

    const cafeterias: CafeteriaInfo[] = [
        {
            id: "main",
            name: "학생회관 식당",
            location: "학생회관 2층",
            phone: "02-1234-5678",
            operatingHours: {
                breakfast: "07:30 - 09:00",
                lunch: "11:30 - 14:00",
                dinner: "17:30 - 19:30",
            },
            capacity: 300,
            currentOccupancy: 180,
            rating: 4.2,
        },
        {
            id: "dorm",
            name: "기숙사 식당",
            location: "생활관 1층",
            phone: "02-1234-5679",
            operatingHours: {
                breakfast: "07:00 - 09:00",
                lunch: "11:30 - 13:30",
                dinner: "17:00 - 19:00",
            },
            capacity: 200,
            currentOccupancy: 120,
            rating: 3.8,
        },
    ]

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/auth/login")
        }

        const dummyMenu: DailyMenu[] = [
            {
                date: "2025-05-23",
                breakfast: [
                    {
                        id: "1",
                        name: "김치찌개",
                        price: 4000,
                        category: "main",
                        calories: 320,
                        rating: 4.5,
                        isSpicy: true,
                    },
                    {
                        id: "2",
                        name: "계란말이",
                        price: 2000,
                        category: "side",
                        calories: 180,
                        rating: 4.2,
                    },
                    {
                        id: "3",
                        name: "미역국",
                        price: 1500,
                        category: "soup",
                        calories: 45,
                        rating: 3.8,
                    },
                ],
                lunch: [
                    {
                        id: "4",
                        name: "불고기덮밥",
                        price: 6000,
                        category: "main",
                        calories: 650,
                        rating: 4.7,
                    },
                    {
                        id: "5",
                        name: "잡채",
                        price: 3000,
                        category: "side",
                        calories: 220,
                        rating: 4.3,
                    },
                    {
                        id: "6",
                        name: "된장국",
                        price: 2000,
                        category: "soup",
                        calories: 80,
                        rating: 4.0,
                    },
                    {
                        id: "7",
                        name: "비빔밥",
                        price: 5500,
                        category: "main",
                        calories: 580,
                        rating: 4.4,
                        isVegetarian: true,
                    },
                ],
                dinner: [
                    {
                        id: "8",
                        name: "치킨까스",
                        price: 7000,
                        category: "main",
                        calories: 580,
                        rating: 4.6,
                    },
                    {
                        id: "9",
                        name: "샐러드",
                        price: 2500,
                        category: "side",
                        calories: 120,
                        rating: 4.1,
                        isVegetarian: true,
                    },
                    {
                        id: "10",
                        name: "콘크림스프",
                        price: 2000,
                        category: "soup",
                        calories: 150,
                        rating: 4.2,
                    },
                ],
                specialMenu: [
                    {
                        id: "11",
                        name: "오늘의 특선 - 갈비탕",
                        price: 8000,
                        category: "main",
                        calories: 720,
                        rating: 4.8,
                    },
                ],
            },
        ]
        setWeeklyMenu(dummyMenu)
    }, [router])

    const todayMenu = weeklyMenu.find((menu) => menu.date === selectedDate)
    const currentMealItems = todayMenu ? todayMenu[selectedMeal] : []
    const specialItems = todayMenu?.specialMenu || []
    const currentCafeteria = cafeterias.find((c) => c.id === selectedCafeteria)!

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "main":
                return "🍽️"
            case "side":
                return "🥗"
            case "soup":
                return "🍲"
            case "dessert":
                return "🍰"
            case "drink":
                return "🥤"
            default:
                return "🍴"
        }
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "main":
                return "bg-blue-100 text-blue-800"
            case "side":
                return "bg-green-100 text-green-800"
            case "soup":
                return "bg-orange-100 text-orange-800"
            case "dessert":
                return "bg-pink-100 text-pink-800"
            case "drink":
                return "bg-purple-100 text-purple-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const toggleFavorite = (itemId: string) => {
        setFavoriteItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
    }

    const totalCalories = currentMealItems.reduce((sum, item) => sum + (item.calories || 0), 0)
    const totalPrice = currentMealItems.reduce((sum, item) => sum + item.price, 0)
    const occupancyRate = Math.round((currentCafeteria.currentOccupancy / currentCafeteria.capacity) * 100)

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 text-gray-900">
            <header className="bg-white/20 backdrop-blur-md text-gray-800 py-4 px-6 flex items-center shadow-lg border-b border-white/30">
                <button
                    onClick={() => router.push("/")}
                    className="mr-4 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm"
                    aria-label="뒤로 가기"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
                    <Utensils className="w-6 h-6 mr-2 text-indigo-600" />
                    식단 및 학식 정보
                </h1>
            </header>

            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* 상단 컨트롤 */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedCafeteria}
                                onChange={(e) => setSelectedCafeteria(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                            >
                                {cafeterias.map((cafeteria) => (
                                    <option key={cafeteria.id} value={cafeteria.id}>
                                        {cafeteria.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                            />
                        </div>

                        <div className="flex space-x-2">
                            {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                                <button
                                    key={meal}
                                    onClick={() => setSelectedMeal(meal)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                        selectedMeal === meal
                                            ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg"
                                            : "bg-white/60 text-gray-700 hover:bg-white/80"
                                    }`}
                                >
                                    {meal === "breakfast" ? "조식" : meal === "lunch" ? "중식" : "석식"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <MapPin className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">식당 평점</h3>
                                <p className="text-3xl font-bold">{currentCafeteria.rating}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <Zap className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">총 칼로리</h3>
                                <p className="text-3xl font-bold">{totalCalories}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-500/80 to-orange-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <DollarSign className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">총 가격</h3>
                                <p className="text-3xl font-bold">{totalPrice.toLocaleString()}원</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-red-500/80 to-pink-500/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-xl border border-white/30">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">혼잡도</h3>
                                <p className="text-3xl font-bold">{occupancyRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 특선 메뉴 */}
                {specialItems.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-400/80 to-orange-500/80 backdrop-blur-md text-white rounded-2xl shadow-xl p-6 mb-8 border border-white/30">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <Star className="w-6 h-6 mr-2" />
                            오늘의 특선 메뉴
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {specialItems.map((item) => (
                                <div key={item.id} className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        <button
                                            onClick={() => toggleFavorite(item.id)}
                                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                        >
                                            <Heart
                                                className={`w-5 h-5 ${
                                                    favoriteItems.includes(item.id) ? "fill-red-300 text-red-300" : "text-white"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>{item.price.toLocaleString()}원</span>
                                        <div className="flex items-center">
                                            <Star className="w-4 h-4 mr-1 fill-yellow-300 text-yellow-300" />
                                            <span>{item.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 메뉴 목록 */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                            {selectedMeal === "breakfast" ? "조식" : selectedMeal === "lunch" ? "중식" : "석식"} 메뉴
                        </h2>
                        <p className="text-gray-600 mt-1">{currentCafeteria.operatingHours[selectedMeal]}</p>
                    </div>

                    {currentMealItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentMealItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-gradient-to-br from-white/60 to-indigo-50/60 backdrop-blur-sm rounded-xl border border-white/30 p-4 hover:from-white/80 hover:to-indigo-50/80 transition-all shadow-md"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                                            <div>
                                                <h3 className="font-medium text-gray-900 flex items-center">
                                                    {item.name}
                                                    {item.isVegetarian && <span className="ml-2 text-green-600">🌱</span>}
                                                    {item.isSpicy && <span className="ml-1 text-red-600">🌶️</span>}
                                                </h3>
                                                <span
                                                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getCategoryColor(item.category)}`}
                                                >
                          {item.category}
                        </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleFavorite(item.id)}
                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <Heart
                                                className={`w-5 h-5 ${
                                                    favoriteItems.includes(item.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">가격</span>
                                            <span className="font-semibold text-orange-600">{item.price.toLocaleString()}원</span>
                                        </div>
                                        {item.calories && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">칼로리</span>
                                                <span className="font-medium">{item.calories}kcal</span>
                                            </div>
                                        )}
                                        {item.rating && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">평점</span>
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-medium">{item.rating}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">선택한 날짜의 메뉴 정보가 없습니다.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
