const fs = require('fs');
const path = require('path');

const locales = ['en', 'uz', 'ru', 'ar'];

const extra = {
  en: {
    materials: {
      titleRequired: 'Please enter a title',
      groupRequired: 'Please select a target group',
      fileRequired: 'Please select a file to upload',
      pdfDocs: 'PDF Documents',
      videoLectures: 'Video Lectures',
      zipArchives: 'Archive / ZIP Files',
      noMaterials: 'No learning materials found',
      noMaterialsDesc: 'Click "Upload Resource" to share course files.',
      uploadSubtitle: 'Add slides, documents, or curriculum exercises for student download',
      selectFile: 'Select File'
    },
    announcements: {
      requiredFields: 'Title and content are required',
      noAnnouncements: 'No announcements broadcasted yet',
      pinned: 'Pinned',
      audience: 'Audience',
      publishedBy: 'Published by',
      pin: 'Pin to top',
      unpin: 'Unpin',
      targetGroup: 'Target Group',
      allGroups: 'All Groups (Campus-Wide)',
      targetRole: 'Target Role',
      everyone: 'Everyone',
      content: 'Message Content',
      pinCheckbox: 'Pin this announcement at the top of the feed'
    }
  },
  uz: {
    materials: {
      titleRequired: 'Iltimos, sarlavhani kiriting',
      groupRequired: 'Iltimos, guruhni tanlang',
      fileRequired: 'Iltimos, yuklash uchun fayl tanlang',
      pdfDocs: 'PDF Hujjatlar',
      videoLectures: 'Video Darslar',
      zipArchives: 'Arxiv / ZIP fayllar',
      noMaterials: 'O‘quv materiallari topilmadi',
      noMaterialsDesc: 'Fayllarni ulashish uchun "Resurs yuklash" tugmasini bosing.',
      uploadSubtitle: 'Talabalar yuklab olishi uchun slaydlar, darsliklar yoki mashqlarni qo‘shing',
      selectFile: 'Faylni tanlang'
    },
    announcements: {
      requiredFields: 'Mavzu va matn to‘ldirilishi majburiy',
      noAnnouncements: 'Hozircha e‘lonlar berilmagan',
      pinned: 'Qadalgan',
      audience: 'Auditoriya',
      publishedBy: 'Muallif',
      pin: 'Yuqoriga qadash',
      unpin: 'Qadashni bekor qilish',
      targetGroup: 'Mo‘ljallangan guruh',
      allGroups: 'Barcha guruhlar (Umumiy)',
      targetRole: 'Mo‘ljallangan rol',
      everyone: 'Barcha foydalanuvchilar',
      content: 'E‘lon matni',
      pinCheckbox: 'Ushbu e‘lonni lenta yuqorisiga qadash'
    }
  },
  ru: {
    materials: {
      titleRequired: 'Пожалуйста, введите название',
      groupRequired: 'Пожалуйста, выберите группу',
      fileRequired: 'Пожалуйста, выберите файл для загрузки',
      pdfDocs: 'PDF Документы',
      videoLectures: 'Видеоуроки',
      zipArchives: 'Архивы / ZIP файлы',
      noMaterials: 'Учебные материалы не найдены',
      noMaterialsDesc: 'Нажмите «Загрузить ресурс», чтобы поделиться файлами курса.',
      uploadSubtitle: 'Добавьте слайды, документы или упражнения для скачивания студентами',
      selectFile: 'Выберите файл'
    },
    announcements: {
      requiredFields: 'Тема и текст обязательны для заполнения',
      noAnnouncements: 'Объявления еще не опубликованы',
      pinned: 'Закреплено',
      audience: 'Аудитория',
      publishedBy: 'Опубликовано',
      pin: 'Закрепить наверху',
      unpin: 'Открепить',
      targetGroup: 'Целевая группа',
      allGroups: 'Все группы (Для всех)',
      targetRole: 'Целевая роль',
      everyone: 'Все пользователи',
      content: 'Текст объявления',
      pinCheckbox: 'Закрепить это объявление вверху ленты'
    }
  },
  ar: {
    materials: {
      titleRequired: 'يرجى إدخال عنوان',
      groupRequired: 'يرجى اختيار المجموعة المستهدفة',
      fileRequired: 'يرجى تحديد ملف للتحميل',
      pdfDocs: 'مستندات PDF',
      videoLectures: 'محاضرات فيديو',
      zipArchives: 'ملفات مضغوطة / ZIP',
      noMaterials: 'لم يتم العثور على مواد تعليمية',
      noMaterialsDesc: 'انقر فوق "تحميل المورد" لمشاركة ملفات الدورة التدريبية.',
      uploadSubtitle: 'أضف شرائح أو مستندات أو تمارين منهجية ليقوم الطلاب بتنزيلها',
      selectFile: 'حدد الملف'
    },
    announcements: {
      requiredFields: 'العنوان والمحتوى مطلوبان',
      noAnnouncements: 'لم يتم بث أي إعلانات حتى الآن',
      pinned: 'مثبت',
      audience: 'الجمهور',
      publishedBy: 'نشر بواسطة',
      pin: 'تثبيت في الأعلى',
      unpin: 'إلغاء التثبيت',
      targetGroup: 'المجموعة المستهدفة',
      allGroups: 'جميع المجموعات',
      targetRole: 'الدور المستهدف',
      everyone: 'الجميع',
      content: 'محتوى الرسالة',
      pinCheckbox: 'تثبيت هذا الإعلان في أعلى الخلاصة'
    }
  }
};

for (const lang of locales) {
  const file = path.join(__dirname, '..', 'src', 'i18n', 'locales', lang + '.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.translation.materials = data.translation.materials || {};
  Object.assign(data.translation.materials, extra[lang].materials);
  data.translation.announcements = data.translation.announcements || {};
  Object.assign(data.translation.announcements, extra[lang].announcements);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
console.log('Materials & Announcements keys synced successfully!');
