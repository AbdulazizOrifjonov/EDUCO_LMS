const fs = require('fs');
const path = require('path');

const locales = ['en', 'uz', 'ru', 'ar'];

const extra = {
  en: {
    tuition: {
      subtitle: 'Track student fee balances, monitor collections, and log incoming installments',
      recordPayment: 'Record Payment',
      paidInFull: 'Paid In Full',
      feeBalances: 'Student Fee Balances',
      paymentHistory: 'Payment History',
      searchPlaceholder: 'Search by student name or email...',
      lastPayment: 'Last Payment',
      pay: 'Pay',
      amount: 'Amount',
      cleared: 'Cleared',
      recordPaymentTitle: 'Record Student Payment',
      recordPaymentSubtitle: 'Log received tuition payment into EDUCO ledger'
    }
  },
  uz: {
    tuition: {
      subtitle: 'Talabalar to‘lov balansini kuzatish, tushumlarni monitoring qilish va to‘lovlarni kiritish',
      recordPayment: 'To‘lovni qabul qilish',
      paidInFull: 'To‘liq to‘langan',
      feeBalances: 'Talabalar qarzdorlik holati',
      paymentHistory: 'To‘lovlar tarixi',
      searchPlaceholder: 'Talaba ismi yoki pochtasi bo‘yicha qidirish...',
      lastPayment: 'Oxirgi to‘lov',
      pay: 'To‘lash',
      amount: 'Summa',
      cleared: 'Qabul qilindi',
      recordPaymentTitle: 'Talaba to‘lovini kiritish',
      recordPaymentSubtitle: 'O‘quvchining o‘qish to‘lovini EDUCO tizimiga qayd etish'
    }
  },
  ru: {
    tuition: {
      subtitle: 'Отслеживание баланса оплаты обучения, мониторинг поступлений и учет платежей',
      recordPayment: 'Принять платеж',
      paidInFull: 'Оплачено полностью',
      feeBalances: 'Баланс оплаты студентов',
      paymentHistory: 'История платежей',
      searchPlaceholder: 'Поиск по имени студента или email...',
      lastPayment: 'Последний платеж',
      pay: 'Оплатить',
      amount: 'Сумма',
      cleared: 'Проведено',
      recordPaymentTitle: 'Регистрация платежа студента',
      recordPaymentSubtitle: 'Внесение данных об оплате за обучение в журнал EDUCO'
    }
  },
  ar: {
    tuition: {
      subtitle: 'تتبع أرصدة رسوم الطلاب ومراقبة التحصيلات وتسجيل الأقساط الواردة',
      recordPayment: 'تسجيل الدفعة',
      paidInFull: 'مدفوع بالكامل',
      feeBalances: 'أرصدة رسوم الطلاب',
      paymentHistory: 'سجل المدفوعات',
      searchPlaceholder: 'البحث باسم الطالب أو البريد الإلكتروني...',
      lastPayment: 'آخر دفعة',
      pay: 'دفع',
      amount: 'المبلغ',
      cleared: 'مكتمل',
      recordPaymentTitle: 'تسجيل دفعة الطالب',
      recordPaymentSubtitle: 'تسجيل الرسوم الدراسية المستلمة في دفتر الأستاذ'
    }
  }
};

for (const lang of locales) {
  const file = path.join(__dirname, '..', 'src', 'i18n', 'locales', lang + '.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.translation.tuition = data.translation.tuition || {};
  Object.assign(data.translation.tuition, extra[lang].tuition);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
console.log('Tuition keys injected successfully!');
