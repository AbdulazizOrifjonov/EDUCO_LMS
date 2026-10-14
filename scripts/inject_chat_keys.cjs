const fs = require('fs');
const path = require('path');

const locales = ['en', 'uz', 'ru', 'ar'];

const extra = {
  en: {
    chat: {
      noChats: 'No group chats available',
      message: 'Message',
      validVideoAlert: 'Please select a valid video file',
      uploadInstead: 'Upload an existing video from your device instead',
      chooseVideoFile: 'Choose Video File',
      frontCamera: 'Front',
      rearCamera: 'Rear',
      rerecord: 'Re-record',
      tryCameraAgain: 'Try Camera Again',
      uploadFile: 'Upload file',
      startRecording: 'Start Recording'
    }
  },
  uz: {
    chat: {
      noChats: 'Guruh chatlari mavjud emas',
      message: 'Xabar',
      validVideoAlert: 'Iltimos, to‘g‘ri video faylni tanlang',
      uploadInstead: 'Qurilmangizdan mavjud videoni yuklashingiz mumkin',
      chooseVideoFile: 'Video faylni tanlash',
      frontCamera: 'Old kamera',
      rearCamera: 'Orqa kamera',
      rerecord: 'Qayta yozib olish',
      tryCameraAgain: 'Kamerani qayta yoqish',
      uploadFile: 'Fayl yuklash',
      startRecording: 'Yozishni boshlash'
    }
  },
  ru: {
    chat: {
      noChats: 'Групповые чаты недоступны',
      message: 'Сообщение',
      validVideoAlert: 'Пожалуйста, выберите корректный видеофайл',
      uploadInstead: 'Вы можете загрузить готовое видео с вашего устройства',
      chooseVideoFile: 'Выбрать видеофайл',
      frontCamera: 'Передняя',
      rearCamera: 'Задняя',
      rerecord: 'Перезаписать',
      tryCameraAgain: 'Попробовать камеру снова',
      uploadFile: 'Загрузить файл',
      startRecording: 'Начать запись'
    }
  },
  ar: {
    chat: {
      noChats: 'لا توجد محادثات جماعية متاحة',
      message: 'رسالة',
      validVideoAlert: 'يرجى تحديد ملف فيديو صالح',
      uploadInstead: 'قم بتحميل مقطع فيديو موجود من جهازك بدلاً من ذلك',
      chooseVideoFile: 'اختر ملف الفيديو',
      frontCamera: 'أمامية',
      rearCamera: 'خلفية',
      rerecord: 'إعادة التسجيل',
      tryCameraAgain: 'جرّب الكاميرا مجددًا',
      uploadFile: 'تحميل ملف',
      startRecording: 'بدء التسجيل'
    }
  }
};

for (const lang of locales) {
  const file = path.join(__dirname, '..', 'src', 'i18n', 'locales', lang + '.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.translation.chat = data.translation.chat || {};
  Object.assign(data.translation.chat, extra[lang].chat);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
console.log('Chat keys injected successfully!');
