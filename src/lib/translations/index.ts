type Language = 'en' | 'he' | 'ar';

interface Translations {
  [key: string]: {
    [key in Language]: string;
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
  }
}; 