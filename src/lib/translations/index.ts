type Language = 'en' | 'he' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    he: string;
    ar?: string; // optional: falls back to English when missing
  };
}

export const translations: Translations = {
  // Navigation
  'manager.dashboard': {
    en: 'Manager Dashboard',
    he: 'לוח בקרה למנהל',
    ar: 'لوحة تحكم المدير'
  },
  'office.dashboard': {
    en: 'Office Dashboard',
    he: 'לוח בקרה למשרד',
    ar: 'لوحة تحكم المكتب'
  },
  'my.requests': {
    en: 'My Requests',
    he: 'הבקשות שלי',
    ar: 'طلباتي'
  },
  'profile': {
    en: 'Profile',
    he: 'פרופיל',
    ar: 'الملف الشخصي'
  },
  'logout': {
    en: 'Logout',
    he: 'התנתק',
    ar: 'تسجيل خروج'
  },

  // Dashboard
  'overview': {
    en: 'Overview',
    he: 'סקירה כללית',
    ar: 'نظرة عامة'
  },
  'employees': {
    en: 'Employees',
    he: 'עובדים',
    ar: 'الموظفين'
  },
  'reports': {
    en: 'Reports',
    he: 'דוחות',
    ar: 'التقارير'
  },
  'settings': {
    en: 'Settings',
    he: 'הגדרות',
    ar: 'الإعدادات'
  },

  // Stats
  'total.employees': {
    en: 'Total Employees',
    he: 'סך הכל עובדים',
    ar: 'إجمالي الموظفين'
  },
  'active.requests': {
    en: 'Active Requests',
    he: 'בקשות פעילות',
    ar: 'الطلبات النشطة'
  },
  'approved.extra.shifts': {
    en: 'Approved Extra Shifts',
    he: 'משמרות נוספות מאושרות',
    ar: 'المناوبات الإضافية المعتمدة'
  },

  // Request Types
  'extra.shift': {
    en: 'Extra Shift',
    he: 'משמרת נוספת',
    ar: 'مناوبة إضافية'
  },
  'vacation': {
    en: 'Vacation',
    he: 'חופשה',
    ar: 'إجازة'
  },

  // Status
  'approved': {
    en: 'Approved',
    he: 'מאושר',
    ar: 'معتمد'
  },
  'rejected': {
    en: 'Rejected',
    he: 'נדחה',
    ar: 'مرفوض'
  },
  'pending': {
    en: 'Pending',
    he: 'ממתין',
    ar: 'قيد الانتظار'
  },
  'cancelled': {
    en: 'Cancelled',
    he: 'מבוטל',
    ar: 'ملغى'
  },

  // Common
  'status': {
    en: 'Status',
    he: 'סטטוס',
    ar: 'الحالة'
  },
  'date': {
    en: 'Date',
    he: 'תאריך',
    ar: 'التاريخ'
  },
  'by': {
    en: 'by',
    he: 'על ידי',
    ar: 'بواسطة'
  },
  'request': {
    en: 'Request',
    he: 'בקשה',
    ar: 'طلب'
  },

  // Pending Requests Page
  'pending.requests.title': {
    en: 'Pending Requests',
    he: 'בקשות ממתינות',
    ar: 'الطلبات المعلقة'
  },
  'pending.requests.subtitle': {
    en: 'Review and manage employee requests',
    he: 'סקירה וניהול בקשות עובדים',
    ar: 'مراجعة وإدارة طلبات الموظفين'
  },
  'no.pending.requests': {
    en: 'No pending requests to review',
    he: 'אין בקשות ממתינות לסקירה',
    ar: 'لا توجد طلبات معلقة للمراجعة'
  },

  // Navigation Tabs
  'nav.schedule': {
    en: 'Schedule',
    he: 'לוח זמנים',
    ar: 'الجدول الزمني'
  },
  'nav.all.requests': {
    en: 'All Requests',
    he: 'כל הבקשות',
    ar: 'جميع الطلبات'
  },
  'nav.pending.requests': {
    en: 'Pending Requests',
    he: 'בקשות ממתינות',
    ar: 'الطلبات المعلقة'
  },

  // Reports & Analytics
  'reports.and.analytics': {
    en: 'Reports & Analytics',
    he: 'דוחות וניתוח נתונים',
    ar: 'التقارير والتحليلات'
  },
  'view.statistics': {
    en: 'View statistics and trends',
    he: 'צפה בסטטיסטיקות ומגמות',
    ar: 'عرض الإحصائيات والاتجاهات'
  },
  'total.requests': {
    en: 'Total Requests',
    he: 'סך כל הבקשות',
    ar: 'إجمالي الطلبات'
  },
  'employee.statistics': {
    en: 'Employee Statistics',
    he: 'סטטיסטיקות עובדים',
    ar: 'إحصائيات الموظفين'
  },
  'monthly.trends': {
    en: 'Monthly Trends',
    he: 'מגמות חודשיות',
    ar: 'الاتجاهات الشهرية'
  },
  'export.csv': {
    en: 'Export CSV',
    he: 'ייצא ל-CSV',
    ar: 'تصدير CSV'
  },
  'last.month': {
    en: 'Last Month',
    he: 'חודש אחרון',
    ar: 'الشهر الماضي'
  },
  'full.year': {
    en: 'Full Year',
    he: 'שנה מלאה',
    ar: 'السنة الكاملة'
  },
  'employee.name': {
    en: 'Employee name',
    he: 'שם העובד',
    ar: 'اسم الموظف'
  },
  'total.extra.shifts': {
    en: 'Total Extra Shifts',
    he: 'סך משמרות נוספות',
    ar: 'إجمالي المناوبات الإضافية'
  },
  'extra.shifts.approved': {
    en: 'Extra shifts approved',
    he: 'משמרות נוספות שאושרו',
    ar: 'المناوبات الإضافية المعتمدة'
  },
  'extra.shifts.rejected': {
    en: 'Extra shifts rejected',
    he: 'משמרות נוספות שנדחו',
    ar: 'المناوبات الإضافية المرفوضة'
  },
  'total.vacation.days': {
    en: 'Total vacation days',
    he: 'סך ימי חופשה',
    ar: 'إجمالي أيام الإجازة'
  },

  // Dashboard Overview
  'dashboard.overview': {
    en: 'Overview of workforce management',
    he: 'סקירה כללית של ניהול כוח אדם',
    ar: 'نظرة عامة على إدارة القوى العاملة'
  },

  // Months
  'month.january': {
    en: 'January',
    he: 'ינואר',
    ar: 'يناير'
  },
  'month.february': {
    en: 'February',
    he: 'פברואר',
    ar: 'فبراير'
  },
  'month.march': {
    en: 'March',
    he: 'מרץ',
    ar: 'مارس'
  },
  'month.april': {
    en: 'April',
    he: 'אפריל',
    ar: 'أبريل'
  },
  'month.may': {
    en: 'May',
    he: 'מאי',
    ar: 'مايو'
  },
  'month.june': {
    en: 'June',
    he: 'יוני',
    ar: 'يونيو'
  },
  'month.july': {
    en: 'July',
    he: 'יולי',
    ar: 'يوليو'
  },
  'month.august': {
    en: 'August',
    he: 'אוגוסט',
    ar: 'أغسطس'
  },
  'month.september': {
    en: 'September',
    he: 'ספטמבר',
    ar: 'سبتمبر'
  },
  'month.october': {
    en: 'October',
    he: 'אוקטובר',
    ar: 'أكتوبر'
  },
  'month.november': {
    en: 'November',
    he: 'נובמבר',
    ar: 'نوفمبر'
  },
  'month.december': {
    en: 'December',
    he: 'דצמבר',
    ar: 'ديسمبر'
  },

  // Request Details
  'request.details': {
    en: 'Request Details',
    he: 'פרטי הבקשה',
    ar: 'تفاصيل الطلب'
  },
  'request.date': {
    en: 'Request Date',
    he: 'תאריך הבקשה',
    ar: 'تاريخ الطلب'
  },
  'shift.date': {
    en: 'Shift Date',
    he: 'תאריך המשמרת',
    ar: 'تاريخ المناوبة'
  },
  'requested.by': {
    en: 'Requested by',
    he: 'הוגש על ידי',
    ar: 'مقدم من'
  },
  'approved.by': {
    en: 'Approved by',
    he: 'אושר על ידי',
    ar: 'تمت الموافقة من قبل'
  },
  'rejected.by': {
    en: 'Rejected by',
    he: 'נדחה על ידי',
    ar: 'تم الرفض من قبل'
  },

  // Actions
  'approve': {
    en: 'Approve',
    he: 'אשר',
    ar: 'موافقة'
  },
  'reject': {
    en: 'Reject',
    he: 'דחה',
    ar: 'رفض'
  },
  'cancel': {
    en: 'Cancel',
    he: 'בטל',
    ar: 'إلغاء'
  },
  'save': {
    en: 'Save',
    he: 'שמור',
    ar: 'حفظ'
  },
  'edit': {
    en: 'Edit',
    he: 'ערוך',
    ar: 'تعديل'
  },
  'delete': {
    en: 'Delete',
    he: 'מחק',
    ar: 'حذف'
  },

  // Messages
  'confirm.delete': {
    en: 'Are you sure you want to delete this?',
    he: 'האם אתה בטוח שברצונך למחוק?',
    ar: 'هل أنت متأكد أنك تريد الحذف؟'
  },
  'no.results': {
    en: 'No results found',
    he: 'לא נמצאו תוצאות',
    ar: 'لم يتم العثور على نتائج'
  },
  'loading': {
    en: 'Loading...',
    he: 'טוען...',
    ar: 'جار التحميل...'
  },
  'error.occurred': {
    en: 'An error occurred',
    he: 'אירעה שגיאה',
    ar: 'حدث خطأ'
  },
  'changes.saved': {
    en: 'Changes saved successfully',
    he: 'השינויים נשמרו בהצלחה',
    ar: 'تم حفظ التغييرات بنجاح'
  },

  // Employee Status
  'status.active': {
    en: 'Active',
    he: 'פעיל',
    ar: 'نشط'
  },
  'status.inactive': {
    en: 'Inactive',
    he: 'לא פעיל',
    ar: 'غير نشط'
  },

  // Time Periods
  'today': {
    en: 'Today',
    he: 'היום',
    ar: 'اليوم'
  },
  'this.week': {
    en: 'This Week',
    he: 'השבוע',
    ar: 'هذا الأسبوع'
  },
  'this.month': {
    en: 'This Month',
    he: 'החודש',
    ar: 'هذا الشهر'
  },
  'custom.range': {
    en: 'Custom Range',
    he: 'טווח מותאם אישית',
    ar: 'نطاق مخصص'
  },

  // Forms and Inputs
  'select.option': {
    en: 'Select an option',
    he: 'בחר אפשרות',
    ar: 'اختر خيارًا'
  },
  'search': {
    en: 'Search',
    he: 'חיפוש',
    ar: 'بحث'
  },
  'search.placeholder': {
    en: 'Type to search...',
    he: 'הקלד לחיפוש...',
    ar: 'اكتب للبحث...'
  },
  'filter': {
    en: 'Filter',
    he: 'סינון',
    ar: 'تصفية'
  },
  'clear.filters': {
    en: 'Clear Filters',
    he: 'נקה מסננים',
    ar: 'مسح التصفية'
  },
  'apply.filters': {
    en: 'Apply Filters',
    he: 'החל מסננים',
    ar: 'تطبيق التصفية'
  },

  // Form Fields
  'first.name': {
    en: 'First Name',
    he: 'שם פרטי',
    ar: 'الاسم الأول'
  },
  'last.name': {
    en: 'Last Name',
    he: 'שם משפחה',
    ar: 'اسم العائلة'
  },
  'email': {
    en: 'Email',
    he: 'דואר אלקטרוני',
    ar: 'البريد الإلكتروني'
  },
  'phone': {
    en: 'Phone',
    he: 'טלפון',
    ar: 'الهاتف'
  },
  'address': {
    en: 'Address',
    he: 'כתובת',
    ar: 'العنوان'
  },
  'notes': {
    en: 'Notes',
    he: 'הערות',
    ar: 'ملاحظات'
  },

  // Validation Messages
  'required.field': {
    en: 'This field is required',
    he: 'שדה זה הוא חובה',
    ar: 'هذا الحقل مطلوب'
  },
  'invalid.email': {
    en: 'Invalid email address',
    he: 'כתובת דואר אלקטרוני לא חוקית',
    ar: 'عنوان البريد الإلكتروني غير صالح'
  },
  'invalid.phone': {
    en: 'Invalid phone number',
    he: 'מספר טלפון לא חוקי',
    ar: 'رقم الهاتف غير صالح'
  },

  // Table Headers
  'table.name': {
    en: 'Name',
    he: 'שם',
    ar: 'الاسم'
  },
  'table.type': {
    en: 'Type',
    he: 'סוג',
    ar: 'النوع'
  },
  'table.actions': {
    en: 'Actions',
    he: 'פעולות',
    ar: 'إجراءات'
  },
  'table.date': {
    en: 'Date',
    he: 'תאריך',
    ar: 'التاريخ'
  },
  'table.status': {
    en: 'Status',
    he: 'סטטוס',
    ar: 'الحالة'
  },

  // Pagination
  'page': {
    en: 'Page',
    he: 'עמוד',
    ar: 'صفحة'
  },
  'of': {
    en: 'of',
    he: 'מתוך',
    ar: 'من'
  },
  'next': {
    en: 'Next',
    he: 'הבא',
    ar: 'التالي'
  },
  'previous': {
    en: 'Previous',
    he: 'הקודם',
    ar: 'السابق'
  },
  'items.per.page': {
    en: 'Items per page',
    he: 'פריטים לעמוד',
    ar: 'العناصر في الصفحة'
  },

  // Authentication
  'sign.in': {
    en: 'Sign In',
    he: 'התחבר',
    ar: 'تسجيل الدخول'
  },
  'sign.up': {
    en: 'Sign Up',
    he: 'הרשמה',
    ar: 'إنشاء حساب'
  },
  'forgot.password': {
    en: 'Forgot Password?',
    he: 'שכחת סיסמה?',
    ar: 'نسيت كلمة المرور؟'
  },
  'reset.password': {
    en: 'Reset Password',
    he: 'איפוס סיסמה',
    ar: 'إعادة تعيين كلمة المرور'
  },
  'password': {
    en: 'Password',
    he: 'סיסמה',
    ar: 'كلمة المرور'
  },
  'confirm.password': {
    en: 'Confirm Password',
    he: 'אימות סיסמה',
    ar: 'تأكيد كلمة المرور'
  },

  // User Settings
  'account.settings': {
    en: 'Account Settings',
    he: 'הגדרות חשבון',
    ar: 'إعدادات الحساب'
  },
  'profile.settings': {
    en: 'Profile Settings',
    he: 'הגדרות פרופיל',
    ar: 'إعدادات الملف الشخصي'
  },
  'notification.settings': {
    en: 'Notification Settings',
    he: 'הגדרות התראות',
    ar: 'إعدادات الإشعارات'
  },
  'language.settings': {
    en: 'Language Settings',
    he: 'הגדרות שפה',
    ar: 'إعدادات اللغة'
  },
  'change.password': {
    en: 'Change Password',
    he: 'שינוי סיסמה',
    ar: 'تغيير كلمة المرور'
  },
  'current.password': {
    en: 'Current Password',
    he: 'סיסמה נוכחית',
    ar: 'كلمة المرور الحالية'
  },
  'new.password': {
    en: 'New Password',
    he: 'סיסמה חדשה',
    ar: 'كلمة المرور الجديدة'
  },

  // Notifications
  'notifications': {
    en: 'Notifications',
    he: 'התראות',
    ar: 'الإشعارات'
  },
  'mark.all.read': {
    en: 'Mark all as read',
    he: 'סמן הכל כנקרא',
    ar: 'تحديد الكل كمقروء'
  },
  'no.notifications': {
    en: 'No new notifications',
    he: 'אין התראות חדשות',
    ar: 'لا توجد إشعارات جديدة'
  },
  'new.request': {
    en: 'New request',
    he: 'בקשה חדשה',
    ar: 'طلب جديد'
  },
  'request.approved': {
    en: 'Request approved',
    he: 'הבקשה אושרה',
    ar: 'تمت الموافقة على الطلب'
  },
  'request.rejected': {
    en: 'Request rejected',
    he: 'הבקשה נדחתה',
    ar: 'تم رفض الطلب'
  },

  // Recent Activity
  'recent.activity': {
    en: 'Recent Activity',
    he: 'פעילות אחרונה',
    ar: 'النشاط الأخير'
  },
  'office': {
    en: 'Office',
    he: 'משרד',
    ar: 'مكتب'
  },

  // Office Settings
  'office.settings': {
    en: 'Office Settings',
    he: 'הגדרות משרד',
    ar: 'إعدادات المكتب'
  },
  'notification.settings.description': {
    en: 'Configure how you want to receive notifications about requests and updates',
    he: 'הגדר כיצד ברצונך לקבל התראות על בקשות ועדכונים',
    ar: 'تكوين كيفية تلقي الإشعارات حول الطلبات والتحديثات'
  },
  'email.notifications': {
    en: 'Email Notifications',
    he: 'התראות בדואר אלקטרוני',
    ar: 'إشعارات البريد الإلكتروني'
  },
  'email.notifications.description': {
    en: 'Receive notifications via email',
    he: 'קבל התראות באמצעות דואר אלקטרוני',
    ar: 'تلقي الإشعارات عبر البريد الإلكتروني'
  },
  'working.hours': {
    en: 'Working Hours',
    he: 'שעות עבודה',
    ar: 'ساعات العمل'
  },
  'working.hours.description': {
    en: "Set your office's working hours and days",
    he: 'הגדר את שעות וימי העבודה של המשרד',
    ar: 'تعيين ساعات وأيام العمل في المكتب'
  },
  'start.time': {
    en: 'Start Time',
    he: 'שעת התחלה',
    ar: 'وقت البدء'
  },
  'end.time': {
    en: 'End Time',
    he: 'שעת סיום',
    ar: 'وقت الانتهاء'
  },
  'error.loading.employees': {
    en: 'Failed to load employees',
    he: 'טעינת העובדים נכשלה',
    ar: 'فشل تحميل الموظفين'
  },
  'pending.requests': {
    en: 'Pending Requests',
    he: 'בקשות ממתינות',
    ar: 'الطلبات المعلقة'
  },
  'all.requests': {
    en: 'All Requests',
    he: 'כל הבקשות',
    ar: 'جميع الطلبات'
  },
  'schedule': {
    en: 'Schedule',
    he: 'לוח זמנים',
    ar: 'الجدول الزمني'
  },
  'review.manage.requests': {
    en: 'Review and manage employee requests',
    he: 'סקירה וניהול בקשות עובדים',
    ar: 'مراجعة وإدارة طلبات الموظفين'
  },
  'unknown.employee': {
    en: 'Unknown Employee',
    he: 'עובד לא ידוע',
    ar: 'موظف غير معروف'
  },
  'project': {
    en: 'Project',
    he: 'פרויקט',
    ar: 'مشروع'
  },
  'start.date': {
    en: 'Start Date',
    he: 'תאריך התחלה',
    ar: 'تاريخ البدء'
  },
  'end.date': {
    en: 'End Date',
    he: 'תאריך סיום',
    ar: 'تاريخ الانتهاء'
  },
  'processing': {
    en: 'Processing...',
    he: 'מעבד...',
    ar: 'جاري المعالجة...'
  },
  'filter.by.status': {
    en: 'Filter by status',
    he: 'סינון לפי סטטוס',
    ar: 'تصفية حسب الحالة'
  },
  'all.requests.title': {
    en: 'All Requests',
    he: 'כל הבקשות',
    ar: 'جميع الطلبات'
  },
  'view.requests.history': {
    en: 'View all employee requests history',
    he: 'צפייה בהיסטוריית כל בקשות העובדים',
    ar: 'عرض سجل جميع طلبات الموظفين'
  },
  'no.requests.found': {
    en: 'No requests found',
    he: 'לא נמצאו בקשות',
    ar: 'لم يتم العثور على طلبات'
  },
  'status.pending': {
    en: 'Pending',
    he: 'ממתין',
    ar: 'معلق'
  },
  'status.approved': {
    en: 'Approved',
    he: 'מאושר',
    ar: 'تمت الموافقة'
  },
  'status.rejected': {
    en: 'Rejected',
    he: 'נדחה',
    ar: 'مرفوض'
  },
  'employee.schedule': {
    en: 'Employee Schedule',
    he: 'לוח זמנים עובדים',
    ar: 'جدول الموظفين'
  },
  'view.approved.schedule': {
    en: 'View approved shifts and vacations',
    he: 'צפייה במשמרות וחופשות מאושרות',
    ar: 'عرض المناوبات والإجازات المعتمدة'
  },
  'select.month': {
    en: 'Select Month',
    he: 'בחר חודש',
    ar: 'اختر الشهر'
  },
  'no.scheduled.items': {
    en: 'No scheduled items for this month',
    he: 'אין פריטים מתוכננים לחודש זה',
    ar: 'لا توجد عناصر مجدولة لهذا الشهر'
  },
  'request.status.updated.extra_shift': {
    en: 'Your extra shift request has been {status}',
    he: 'בקשת המשמרת הנוספת שלך {status}',
    ar: 'تم {status} طلب المناوبة الإضافية الخاص بك'
  },
  'request.status.updated.vacation': {
    en: 'Your vacation request has been {status}',
    he: 'בקשת החופשה שלך {status}',
    ar: 'تم {status} طلب الإجازة الخاص بك'
  },
  'request.status.success.approved': {
    en: 'Request approved successfully',
    he: 'הבקשה אושרה בהצלחה',
    ar: 'تم الموافقة على الطلب بنجاح'
  },
  'request.status.success.rejected': {
    en: 'Request rejected successfully',
    he: 'הבקשה נדחתה בהצלחה',
    ar: 'تم رفض الطلب بنجاح'
  },
  'request.status.error.approved': {
    en: 'Failed to approve request',
    he: 'אישור הבקשה נכשל',
    ar: 'فشل في الموافقة على الطلب'
  },
  'request.status.error.rejected': {
    en: 'Failed to reject request',
    he: 'דחיית הבקשה נכשלה',
    ar: 'فشل في رفض الطلب'
  },
  'error.no.user': {
    en: 'No authenticated user found',
    he: 'לא נמצא משתמש מאומת',
    ar: 'لم يتم العثور على مستخدم مصادق عليه'
  },
  'error.no.user.id': {
    en: 'User ID is missing',
    he: 'מזהה המשתמש חסר',
    ar: 'معرف المستخدم مفقود'
  },
  'error.access.denied': {
    en: 'Access denied: Manager role required',
    he: 'הגישה נדחתה: נדרש תפקיד מנהל',
    ar: 'تم رفض الوصول: مطلوب دور المدير'
  },
  'error.loading.requests.title': {
    en: 'Error loading requests',
    he: 'שגיאה בטעינת הבקשות',
    ar: 'خطأ في تحميل الطلبات'
  },
  'error.loading.schedule': {
    en: 'Failed to load schedule',
    he: 'טעינת לוח הזמנים נכשלה',
    ar: 'فشل في تحميل الجدول الزمني'
  },

  // Quick Actions
  'quick.actions': {
    en: 'Quick Actions',
    he: 'פעולות מהירות',
    ar: 'إجراءات سريعة'
  },
  'new.extra.shift': {
    en: 'New Extra Shift',
    he: 'משמרת נוספת חדשה',
    ar: 'مناوبة إضافية جديدة'
  },
  'new.vacation': {
    en: 'New Vacation',
    he: 'חופשה חדשה',
    ar: 'إجازة جديدة'
  },
  'create.request': {
    en: 'Create Request',
    he: 'צור בקשה',
    ar: 'إنشاء طلب'
  },
  'requested.on': {
    en: 'Requested on',
    he: 'הוגש בתאריך',
    ar: 'تم الطلب في'
  },
  'cancel.request': {
    en: 'Cancel Request',
    he: 'בטל בקשה',
    ar: 'إلغاء الطلب'
  },
  'request.cancelled': {
    en: 'Request cancelled successfully',
    he: 'הבקשה בוטלה בהצלחה',
    ar: 'تم إلغاء الطلب بنجاح'
  },
  'error.cancelling.request': {
    en: 'Failed to cancel request',
    he: 'ביטול הבקשה נכשל',
    ar: 'فشل في إلغاء الطلب'
  },
  'error.loading.requests': {
    en: 'Failed to load requests',
    he: 'טעינת הבקשות נכשלה',
    ar: 'فشل في تحميل الطلبات'
  },

  // New Request Form
  'submit.new.request': {
    en: 'Submit a new shift or vacation request',
    he: 'הגש בקשה חדשה למשמרת או חופשה',
    ar: 'تقديم طلب مناوبة أو إجازة جديد'
  },
  'request.type': {
    en: 'Request Type',
    he: 'סוג הבקשה',
    ar: 'نوع الطلب'
  },
  'project.name': {
    en: 'Project Name',
    he: 'שם הפרויקט',
    ar: 'اسم المشروع'
  },
  'enter.project.name': {
    en: 'Enter project name',
    he: 'הכנס שם פרויקט',
    ar: 'أدخل اسم المشروع'
  },
  'submitting': {
    en: 'Submitting...',
    he: 'שולח...',
    ar: 'جاري الإرسال...'
  },
  'submit.request': {
    en: 'Submit Request',
    he: 'שלח בקשה',
    ar: 'إرسال الطلب'
  },
  'request.submitted': {
    en: 'Request submitted successfully!',
    he: 'הבקשה נשלחה בהצלחה!',
    ar: 'تم إرسال الطلب بنجاح!'
  },
  'error.no.manager': {
    en: 'No manager found in the system',
    he: 'לא נמצא מנהל במערכת',
    ar: 'لم يتم العثور على مدير في النظام'
  },
  'error.fetching.manager': {
    en: 'Failed to fetch manager information',
    he: 'נכשל בהבאת מידע המנהל',
    ar: 'فشل في جلب معلومات المدير'
  },
  'error.no.manager.assigned': {
    en: 'No manager assigned. Please contact administrator.',
    he: 'לא הוקצה מנהל. אנא צור קשר עם מנהל המערכת.',
    ar: 'لم يتم تعيين مدير. يرجى الاتصال بمسؤول النظام.'
  },
  'error.login.required': {
    en: 'You must be logged in to submit a request.',
    he: 'עליך להיות מחובר כדי להגיש בקשה.',
    ar: 'يجب أن تكون مسجل الدخول لتقديم طلب.'
  },
  'error.submitting.request': {
    en: 'Failed to submit request',
    he: 'נכשל בשליחת הבקשה',
    ar: 'فشل في إرسال الطلب'
  },
  'error.submitting.request.try.again': {
    en: 'Failed to submit request. Please try again.',
    he: 'נכשל בשליחת הבקשה. אנא נסה שוב.',
    ar: 'فشل في إرسال الطلب. حاول مرة أخرى.'
  },

  // Attachments (English + Hebrew only; Arabic falls back to English)
  'attachments.add': { en: 'Attach files', he: 'צירוף קבצים' },
  'attachments.processing': { en: 'Processing...', he: 'מעבד...' },
  'attachments.hint': { en: 'PDF or images, up to {max} files. Large photos are shrunk automatically.', he: 'PDF או תמונות, עד {max} קבצים. תמונות גדולות מוקטנות אוטומטית.' },
  'attachments.remove': { en: 'Remove file', he: 'הסרת קובץ' },
  'attachments.view': { en: 'View', he: 'צפייה' },
  'attachments.download': { en: 'Download', he: 'הורדה' },
  'attachments.none': { en: 'No files attached', he: 'לא צורפו קבצים' },
  'attachments.error.type': { en: 'only PDF or image files are allowed', he: 'ניתן לצרף רק קבצי PDF או תמונות' },
  'attachments.error.size': { en: 'file is too large (max ~1MB). Try scanning at a lower resolution.', he: 'הקובץ גדול מדי (עד כ-1MB). נסו לסרוק ברזולוציה נמוכה יותר.' },
  'attachments.error.unreadable': { en: 'the image could not be read', he: 'לא ניתן לקרוא את התמונה' },
  'attachments.error.generic': { en: 'could not add the file', he: 'לא ניתן לצרף את הקובץ' },
  'attachments.error.count': { en: 'You can attach up to {max} files', he: 'ניתן לצרף עד {max} קבצים' },
  'attachments.error.load': { en: 'Could not load the files', he: 'לא ניתן לטעון את הקבצים' },

  // Sick leave / reserve duty reports (English + Hebrew only)
  'sick.leave': { en: 'Sick leave', he: 'מחלה' },
  'reserve.duty': { en: 'Reserve duty', he: 'מילואים' },
  'new.sick.leave': { en: 'Report sick leave', he: 'דיווח מחלה' },
  'new.reserve.duty': { en: 'Report reserve duty', he: 'דיווח מילואים' },
  'status.cancelled': { en: 'Cancelled', he: 'בוטל' },
  'status.submitted': { en: 'Received', he: 'התקבל' },
  'status.handled': { en: 'Handled', he: 'טופל' },
  'missing.document': { en: 'Missing document', he: 'חסר מסמך' },
  'report.no.approval.needed': { en: 'No manager approval needed - the report goes straight to the office.', he: 'לא נדרש אישור מנהל - הדיווח עובר ישירות למשרד.' },
  'report.document.sick': { en: "Doctor's sick note", he: 'אישור מחלה מהרופא' },
  'report.document.reserve': { en: 'Reserve duty form (3010)', he: 'טופס מילואים (3010)' },
  'report.document.later': { en: 'No file yet? You can submit now and add it later - until then the report is marked "Missing document".', he: 'אין עדיין קובץ? אפשר לשלוח עכשיו ולצרף אחר כך - עד אז הדיווח יסומן "חסר מסמך".' },
  'report.submitted': { en: 'Report submitted to the office', he: 'הדיווח נשלח למשרד' },
  'report.submitted.missing.document': { en: 'Report submitted. Remember to attach the document.', he: 'הדיווח נשלח. אל תשכחו לצרף את המסמך.' },
  'report.upload.failed': { en: 'The report was saved, but uploading the file failed. Please try adding it again from the report page.', he: 'הדיווח נשמר, אך העלאת הקובץ נכשלה. נסו לצרף אותו שוב מדף הדיווח.' },
  'report.details.and.documents': { en: 'Details & documents', he: 'פרטים ומסמכים' },
  'report.not.found': { en: 'Report not found.', he: 'הדיווח לא נמצא.' },
  'back.to.my.requests': { en: 'Back to my requests', he: 'חזרה לבקשות שלי' },
  'report.files.added': { en: 'Files added', he: 'הקבצים צורפו' },
  'report.updated': { en: 'Report updated', he: 'הדיווח עודכן' },
  'report.update.failed': { en: 'Update failed', he: 'העדכון נכשל' },
  'report.confirm.cancel': { en: 'Cancel this report?', he: 'לבטל את הדיווח?' },
  'report.edit.dates': { en: 'Edit dates', he: 'עריכת תאריכים' },
  'report.locked.handled': { en: 'The office has handled this report, so it can no longer be changed.', he: 'המשרד טיפל בדיווח, ולכן לא ניתן לשנות אותו יותר.' },
  'report.upload.files': { en: 'Upload files', he: 'העלאת הקבצים' },
  'report.cancel': { en: 'Cancel report', he: 'ביטול הדיווח' },
  'report.mark.handled': { en: 'Mark as handled', he: 'סימון כטופל' },
  'report.reopen': { en: 'Reopen', he: 'החזרה לטיפול' },
  'error.end.before.start': { en: 'End date is before start date', he: 'תאריך הסיום לפני תאריך ההתחלה' },
  'attachments.confirm.delete': { en: 'Delete this file?', he: 'למחוק את הקובץ?' },
  'office.documents.nav': { en: 'Reports & documents', he: 'דיווחים ומסמכים' },
  'office.documents.title': { en: 'Reports & documents', he: 'דיווחים ומסמכים' },
  'office.documents.subtitle': { en: 'Sick leave, reserve duty and petty cash, with their attached documents', he: 'דיווחי מחלה ומילואים ובקשות קופה קטנה, והמסמכים שצורפו אליהם' },
  'office.documents.empty': { en: 'No reports match the selected filters', he: 'אין דיווחים שתואמים לסינון' },
  'filter.all.types': { en: 'All types', he: 'כל הסוגים' },
  'filter.all.employees': { en: 'All employees', he: 'כל העובדים' },
  'filter.all.statuses': { en: 'All statuses', he: 'כל הסטטוסים' },
  'dates': { en: 'Dates', he: 'תאריכים' },
  'days': { en: 'Days', he: 'ימים' },
  'documents': { en: 'Documents', he: 'מסמכים' },
  'details': { en: 'Details', he: 'פרטים' },
  'close': { en: 'Close', he: 'סגירה' },

  // Petty cash (English + Hebrew only)
  'petty.cash': { en: 'Petty cash', he: 'קופה קטנה' },
  'new.petty.cash': { en: 'Petty cash request', he: 'בקשת קופה קטנה' },
  'status.paid': { en: 'Paid', he: 'שולם' },
  'petty.cash.description': { en: 'What was purchased', he: 'עבור מה' },
  'petty.cash.description.placeholder': { en: 'e.g. office supplies, fuel, parking', he: 'לדוגמה: ציוד משרדי, דלק, חניה' },
  'petty.cash.expense.date': { en: 'Expense date', he: 'תאריך ההוצאה' },
  'petty.cash.receipts': { en: 'Receipts', he: 'חשבוניות' },
  'petty.cash.add.receipt': { en: 'Add receipt', he: 'הוספת חשבונית' },
  'petty.cash.receipts.hint': { en: 'Photo or PDF of each receipt, with its amount. Up to {max} receipts.', he: 'צילום או PDF של כל חשבונית, עם הסכום שלה. עד {max} חשבוניות.' },
  'petty.cash.amount': { en: 'Amount', he: 'סכום' },
  'petty.cash.total': { en: 'Total', he: 'סה"כ' },
  'petty.cash.error.no.receipts': { en: 'Please attach at least one receipt', he: 'יש לצרף לפחות חשבונית אחת' },
  'petty.cash.error.amount': { en: 'Please enter a valid amount for each receipt (e.g. 125.50)', he: 'יש להזין סכום תקין לכל חשבונית (לדוגמה 125.50)' },
  'petty.cash.submitted': { en: 'Petty cash request sent to the office', he: 'בקשת הקופה הקטנה נשלחה למשרד' },
  'petty.cash.mark.paid': { en: 'Mark as paid', he: 'סימון כשולם' },
  'petty.cash.locked.paid': { en: 'The office has paid this request, so it can no longer be changed.', he: 'המשרד שילם את הבקשה, ולכן לא ניתן לשנות אותה יותר.' },
  'optional': { en: 'optional', he: 'לא חובה' },

  // Notifications (English + Hebrew only)
  'notifications.empty': { en: 'No notifications', he: 'אין התראות' },
  'notifications.mark.all.read': { en: 'Mark all as read', he: 'סימון הכול כנקרא' },
  'notif.request.status': { en: 'Your {type} request for {date} was {status}', he: 'בקשת {type} שלך ל-{date}: {status}' },
  'notif.request.submitted': { en: 'New request awaiting approval', he: 'בקשה חדשה ממתינה לאישור' },
  'notif.request.cancelled': { en: 'An approved request was cancelled', he: 'בקשה מאושרת בוטלה' },

  // Excel report (English + Hebrew only)
  'export.excel': { en: 'Export to Excel', he: 'ייצוא לאקסל' },
  'report.excel.exporting': { en: 'Preparing...', he: 'מכין...' },
  'report.excel.error': { en: 'Could not create the Excel file', he: 'לא ניתן היה ליצור את קובץ האקסל' },
  'report.excel.title': { en: 'Monthly report', he: 'דוח חודשי' },
  'report.excel.summary': { en: 'Summary', he: 'סיכום' },
  'report.excel.details': { en: 'Details', he: 'פירוט' },
  'report.excel.project.description': { en: 'Project / description', he: 'פרויקט / תיאור' },
  'report.sick.days': { en: 'Sick days', he: 'ימי מחלה' },
  'report.reserve.days': { en: 'Reserve duty days', he: 'ימי מילואים' },
  'report.petty.cash.total': { en: 'Petty cash (₪)', he: 'קופה קטנה (₪)' },
  'report.petty.cash.unpaid': { en: 'Of which unpaid (₪)', he: 'מתוכם טרם שולם (₪)' },
  'report.missing.documents': { en: 'Missing documents', he: 'מסמכים חסרים' },
  // New employee UI (2026-10 redesign)
  'nav.home': { en: 'Home', he: 'בית', ar: 'الرئيسية' },
  'nav.new': { en: 'New', he: 'חדש', ar: 'جديد' },
  'nav.approvals': { en: 'Approvals', he: 'אישורים', ar: 'الموافقات' },
  'nav.office': { en: 'Office', he: 'משרד', ar: 'المكتب' },
  'nav.language': { en: 'Language', he: 'שפה', ar: 'اللغة' },
  'greeting.morning': { en: 'Good morning', he: 'בוקר טוב', ar: 'صباح الخير' },
  'greeting.afternoon': { en: 'Good afternoon', he: 'צהריים טובים', ar: 'مساء الخير' },
  'greeting.evening': { en: 'Good evening', he: 'ערב טוב', ar: 'مساء الخير' },
  'home.what.today': { en: 'What would you like to report?', he: 'מה תרצו לדווח היום?' },
  'home.needs.attention': { en: 'Needs your attention', he: 'דורש את תשומת לבך' },
  'home.missing.doc.text': { en: 'A document is missing for this report. Upload it so the office can process it.', he: 'חסר מסמך בדיווח הזה. העלו אותו כדי שהמשרד יוכל לטפל.' },
  'home.upload.now': { en: 'Upload now', he: 'להעלאה' },
  'home.stat.waiting': { en: 'Awaiting approval', he: 'ממתינות לאישור' },
  'home.stat.shifts.month': { en: 'Extra shifts this month', he: 'משמרות נוספות החודש' },
  'home.stat.vacation.year': { en: 'Vacation days this year', he: 'ימי חופשה השנה' },
  'home.history': { en: 'My requests & reports', he: 'הבקשות והדיווחים שלי' },
  'home.empty.title': { en: 'Nothing here yet', he: 'עוד אין כאן כלום' },
  'home.empty.text': { en: 'Everything you submit will appear here, with its status.', he: 'כל מה שתגישו יופיע כאן, יחד עם הסטטוס שלו.' },
  'home.filter.all': { en: 'All', he: 'הכול' },
  'home.filter.open': { en: 'In progress', he: 'בטיפול' },
  'home.filter.done': { en: 'Done', he: 'הסתיימו' },
  'home.open.details': { en: 'Details & documents', he: 'פרטים ומסמכים' },
  'tile.extra_shift.hint': { en: 'Needs manager approval', he: 'באישור מנהל' },
  'tile.vacation.hint': { en: 'Needs manager approval', he: 'באישור מנהל' },
  'tile.sick.hint': { en: 'Straight to the office', he: 'ישר למשרד' },
  'tile.reserve.hint': { en: 'Straight to the office', he: 'ישר למשרד' },
  'tile.petty_cash.hint': { en: 'Receipts & refund', he: 'קבלות והחזר' },
  'status.pending.long': { en: 'Awaiting manager approval', he: 'ממתין לאישור מנהל' },
  'status.submitted.long': { en: 'Received by the office', he: 'התקבל במשרד' },
  'wizard.choose.type': { en: 'What would you like to submit?', he: 'מה תרצו להגיש?' },
  'wizard.step.type': { en: 'Type', he: 'סוג' },
  'wizard.step.details': { en: 'Details', he: 'פרטים' },
  'wizard.change.type': { en: 'Change', he: 'החלפה' },
  'wizard.back': { en: 'Back', he: 'חזרה' },
  'wizard.one.day': { en: '1 workday', he: 'יום עבודה אחד' },
  'wizard.n.days': { en: '{n} workdays', he: '{n} ימי עבודה' },
  'wizard.no.workdays': { en: 'No workdays in this range', he: 'אין ימי עבודה בטווח הזה' },
  'wizard.send.to.manager': { en: 'Send for approval', he: 'שליחה לאישור' },
  'wizard.send.to.office': { en: 'Send to the office', he: 'שליחה למשרד' },
  'wizard.shift.date': { en: 'Shift date', he: 'תאריך המשמרת' },
  'wizard.from': { en: 'From', he: 'מתאריך' },
  'wizard.until': { en: 'Until', he: 'עד תאריך' },
  'login.welcome': { en: 'Welcome', he: 'ברוכים הבאים' },
  'login.subtitle': { en: 'Sign in to report shifts, vacations and more', he: 'התחברו כדי לדווח משמרות, חופשות ועוד' },
  'login.email': { en: 'Email', he: 'אימייל' },
  'login.password': { en: 'Password', he: 'סיסמה' },
  'login.submit': { en: 'Sign in', he: 'כניסה' },
  'login.signing.in': { en: 'Signing in...', he: 'מתחבר...' },
  'login.error': { en: 'Wrong email or password', he: 'אימייל או סיסמה שגויים' },
  'login.error.generic': { en: 'Sign-in failed. Please try again.', he: 'ההתחברות נכשלה. נסו שוב.' },
  'login.no.account': { en: "Don't have an account?", he: 'אין לכם חשבון?' },
  'login.register': { en: 'Register', he: 'הרשמה' },
  'login.app.name': { en: 'Work log', he: 'יומן עבודה' },
  'home.stat.vacation.left': { en: 'Vacation days left', he: 'ימי חופשה שנותרו' },
  'home.stat.of.quota': { en: 'of {n}', he: 'מתוך {n}' },
  'wizard.balance.after': { en: 'After this request: {n} days left', he: 'אחרי הבקשה יישארו לך {n} ימים' },
  'wizard.balance.over': { en: 'This is {n} days more than your remaining balance', he: 'זה {n} ימים מעבר ליתרה שלך' },
  'quota.title': { en: 'Vacation quota', he: 'מכסת חופשה' },
  'quota.hint': { en: 'Days for the year, incl. carry-over', he: 'ימים לשנה, כולל יתרה משנה קודמת' },
  'quota.used': { en: 'Used', he: 'נוצלו' },
  'quota.left': { en: 'Left', he: 'נותרו' },
  'quota.not.set': { en: 'Not set', he: 'לא הוגדר' },
  'quota.saved': { en: 'Vacation quota saved', he: 'מכסת החופשה נשמרה' },
  'quota.save.failed': { en: 'Could not save the quota', he: 'לא ניתן היה לשמור את המכסה' },
  'quota.invalid': { en: 'Enter a number between 0 and 365', he: 'יש להזין מספר בין 0 ל-365' },
  'office.approved.by': { en: 'approved by {name}', he: 'אושר ע"י {name}' },
  'people.search': { en: 'Search by name or email', he: 'חיפוש לפי שם או אימייל' },
  'people.roles': { en: 'Roles', he: 'הרשאות' },
  'people.edit.name': { en: 'Edit name', he: 'עריכת שם' },
  'people.delete': { en: 'Remove user', he: 'הסרת משתמש' },
  'people.delete.confirm': { en: 'Remove {name} from the system?', he: 'להסיר את {name} מהמערכת?' },
  'people.delete.button': { en: 'Remove', he: 'הסרה' },
  'people.delete.failed': { en: 'Could not remove the user', he: 'לא ניתן היה להסיר את המשתמש' },
  'people.roles.updated': { en: 'Roles updated', he: 'ההרשאות עודכנו' },
  'people.roles.failed': { en: 'Could not update roles', he: 'לא ניתן היה לעדכן הרשאות' },
  'people.name.failed': { en: 'Could not update the name', he: 'לא ניתן היה לעדכן את השם' },
  'people.self.roles': { en: 'You cannot change your own roles', he: 'לא ניתן לשנות את ההרשאות של עצמך' },
  'role.employee': { en: 'Employee', he: 'עובד' },
  'role.manager': { en: 'Manager', he: 'מנהל' },
  'role.office': { en: 'Office', he: 'משרד' },
  'reports.vacation.left': { en: 'Vacation left', he: 'יתרת חופשה' },
  'profile.details': { en: 'My details', he: 'הפרטים שלי' },
  'profile.name': { en: 'Full name', he: 'שם מלא' },
  'profile.email.note': { en: 'The email is used to sign in. To change it, contact the office.', he: 'האימייל משמש לכניסה למערכת. לשינוי יש לפנות למשרד.' },
  'profile.save': { en: 'Save changes', he: 'שמירת שינויים' },
  'profile.saved': { en: 'Your details were saved', he: 'הפרטים נשמרו' },
  'profile.save.failed': { en: 'Could not save your details', he: 'לא ניתן היה לשמור את הפרטים' },
  'saving': { en: 'Saving...', he: 'שומר...' },
  'register.title': { en: 'Create an account', he: 'הרשמה' },
  'register.subtitle': { en: 'New employees sign up here', he: 'עובדים חדשים נרשמים כאן' },
  'register.confirm.password': { en: 'Repeat password', he: 'אימות סיסמה' },
  'register.submit': { en: 'Create account', he: 'יצירת חשבון' },
  'register.creating': { en: 'Creating account...', he: 'יוצר חשבון...' },
  'register.have.account': { en: 'Already have an account?', he: 'כבר יש לכם חשבון?' },
  'register.success': { en: 'Account created!', he: 'החשבון נוצר!' },
  'register.error.mismatch': { en: 'The passwords do not match', he: 'הסיסמאות אינן תואמות' },
  'register.error.generic': { en: 'Registration failed. Please try again.', he: 'ההרשמה נכשלה. נסו שוב.' },
  'register.error.in.use': { en: 'This email is already registered', he: 'האימייל הזה כבר רשום במערכת' },
  'register.error.weak': { en: 'The password must be at least 6 characters', he: 'הסיסמה צריכה להכיל לפחות 6 תווים' },
  'register.error.email': { en: 'Please enter a valid email address', he: 'יש להזין כתובת אימייל תקינה' },
  'home.confirm.cancel': { en: 'Cancel this request?', he: 'לבטל את הבקשה?' },
};
