// tests/full_lifecycle_e2e.test.js
// Comprehensive test verifying User (Roles), Course, Group, SMS, and Website CRUD operations

import { describe, it, expect } from 'vitest';
import * as userService from '@/services/userService';
import * as courseService from '@/services/courseService';
import * as groupService from '@/services/groupService';
import smsService from '@/services/smsService';
import websiteService from '@/services/websiteService';

describe('1. Foydalanuvchilar va Rollar (User & Roles): Yaratish, O‘zgartirish, O‘chirish', () => {
  it('Yangi ro‘lli foydalanuvchi yaratish, tahrirlash va xavfsiz o‘chirish', async () => {
    // A) Yaratish (Role: teacher)
    const newUser = await userService.createUser({
      full_name: 'Test Ustoz Abdulaziz',
      phone: '+998991234567',
      role: 'teacher',
      status: 'active',
      monthly_salary: 3500000,
    });

    expect(newUser).toBeDefined();
    expect(newUser.id).toBeDefined();
    expect(newUser.role).toBe('teacher');
    expect(newUser.full_name).toBe('Test Ustoz Abdulaziz');

    // B) O‘zgartirish (Update) - Rolni 'admin'ga o'zgartirish
    const updatedUser = await userService.updateUser(newUser.id, {
      full_name: 'Test Administrator (Updated)',
      role: 'admin',
      status: 'active',
    });

    expect(updatedUser.full_name).toBe('Test Administrator (Updated)');
    expect(updatedUser.role).toBe('admin');

    // C) O‘chirish (Delete)
    const deleteResult = await userService.deleteUser(newUser.id);
    expect(deleteResult).toBeTruthy();

    // D) Tekshirish (Mavjud emasligi)
    const res = await userService.getUsers({ role: 'all' });
    const userList = res.users || res;
    const found = userList.find((u) => u.id === newUser.id);
    expect(found).toBeUndefined();
  });
});

describe('2. Kurslar Boshqaruvi (Courses): Yaratish, O‘zgartirish, O‘chirish', () => {
  it('Yangi kurs yaratish, maʼlumotlarini yangilash va o‘chirish', async () => {
    // A) Yaratish
    const newCourse = await courseService.createCourse({
      name: 'Fullstack Next.js & AI Dasturlash',
      title: 'Fullstack Next.js & AI Dasturlash',
      category: 'Dasturlash',
      price: 650000,
      duration: '7 oy',
      description: 'Zamonaviy sun’iy intellekt va to‘liq stack web dasturlash kursi.',
      status: 'active',
    });

    expect(newCourse).toBeDefined();
    expect(newCourse.id).toBeDefined();
    expect(newCourse.name || newCourse.title).toContain('Fullstack Next.js');

    // B) O‘zgartirish
    const updatedCourse = await courseService.updateCourse(newCourse.id, {
      name: 'Fullstack Next.js & AI Dasturlash (Pro Yangilangan)',
      title: 'Fullstack Next.js & AI Dasturlash (Pro Yangilangan)',
      price: 700000,
    });

    expect(updatedCourse.name || updatedCourse.title).toContain('Pro Yangilangan');

    // C) O‘chirish
    const deleteRes = await courseService.deleteCourse(newCourse.id);
    expect(deleteRes).toBeTruthy();

    const res = await courseService.getCourses();
    const coursesList = res.courses || res;
    const found = coursesList.find((c) => c.id === newCourse.id);
    expect(found).toBeUndefined();
  });
});

describe('3. Guruhlar Boshqaruvi (Groups): Yaratish, O‘zgartirish, O‘chirish', () => {
  it('Yangi o‘quv guruhi yaratish, dars vaqtlarini o‘zgartirish va o‘chirish', async () => {
    // A) Yaratish
    const newGroup = await groupService.createGroup({
      name: 'FN-104 Frontend Kunduzgi',
      course_id: 'course-1',
      teacher_id: 'teacher-1',
      room: '204-xona',
      days: ['Dushanba', 'Chorshanba', 'Juma'],
      time: '14:00 - 16:00',
      status: 'active',
      monthly_tuition: 500000,
    });

    expect(newGroup).toBeDefined();
    expect(newGroup.id).toBeDefined();
    expect(newGroup.name).toBe('FN-104 Frontend Kunduzgi');

    // B) O‘zgartirish
    const updatedGroup = await groupService.updateGroup(newGroup.id, {
      name: 'FN-104 Frontend Oqshom (O‘zgargan)',
      room: '301-iMac Lab',
      time: '18:30 - 20:30',
    });

    expect(updatedGroup.name).toContain('O‘zgargan');
    expect(updatedGroup.room).toBe('301-iMac Lab');

    // C) O‘chirish
    const deleteResult = await groupService.deleteGroup(newGroup.id);
    expect(deleteResult).toBeTruthy();

    const res = await groupService.getGroups();
    const groupList = res.groups || res;
    const found = groupList.find((g) => g.id === newGroup.id);
    expect(found).toBeUndefined();
  });
});

describe('4. SMS Xabarnomalar (SMS Gateway & Settings): Yaratish, O‘zgartirish, O‘chirish', () => {
  it('SMS qurilmasini ro‘yxatga olish, parametrlarini yangilash va o‘chirish', async () => {
    // A) Yaratish (SMS Gateway Device)
    const device = await smsService.saveSmsDevice({
      name: 'Test Android SMS Gateway',
      url: 'http://192.168.1.150:8080',
      status: 'online',
      simSlot: 1,
    });

    expect(device).toBeDefined();
    expect(device.id).toBeDefined();
    expect(device.name).toBe('Test Android SMS Gateway');

    // B) O‘zgartirish
    const updatedDevice = await smsService.saveSmsDevice({
      id: device.id,
      name: 'Test Android Gateway (Yangilangan)',
      url: 'http://192.168.1.160:8080',
    });

    expect(updatedDevice.name).toContain('Yangilangan');
    expect(updatedDevice.url).toBe('http://192.168.1.160:8080');

    // C) O‘chirish
    const deleteRes = await smsService.deleteSmsDevice(device.id);
    expect(deleteRes).toBeTruthy();

    const devices = await smsService.getSmsDevices();
    const found = devices.find((d) => d.id === device.id);
    expect(found).toBeUndefined();

    // D) SMS sozlamalari yangilanishini tekshirish
    const settings = await smsService.getSmsSettings();
    const updatedSettings = await smsService.updateSmsSettings({
      ...settings,
      sendAttendanceSms: true,
      sendTuitionReminders: true,
    });
    expect(updatedSettings.sendAttendanceSms).toBe(true);
    expect(updatedSettings.sendTuitionReminders).toBe(true);
  });
});

describe('5. Website Boshqaruvi (Website Full CRUD Life-cycle)', () => {
  it('A) Slayder (Slide): Yaratish, Tahrirlash, O‘chirish', () => {
    const slide = websiteService.saveHeroSlide({
      title: 'Maxsus Test Slayd',
      subtitle: 'Amaliy bilimlar',
      tag: 'Test',
      image: 'https://example.com/slide.jpg',
      fit_mode: 'cover',
      object_position: 'center',
      order: 99,
      is_active: true,
    });
    expect(slide.id).toBeDefined();

    // Update
    const updated = websiteService.saveHeroSlide({
      id: slide.id,
      title: 'Maxsus Test Slayd (O‘zgartirilgan)',
      fit_mode: 'contain',
    });
    expect(updated.title).toContain('O‘zgartirilgan');
    expect(updated.fit_mode).toBe('contain');

    // Delete
    websiteService.deleteHeroSlide(slide.id);
    const slides = websiteService.getHeroSlides(false);
    expect(slides.find((s) => s.id === slide.id)).toBeUndefined();
  });

  it('B) Kurs (Course): Yaratish, Tahrirlash, O‘chirish', () => {
    const course = websiteService.saveWebsiteCourse({
      title: 'Node.js Backend Masterkurs',
      category: 'Backend',
      price: '550,000 so‘m/oy',
      duration: '4 oy',
      fit_mode: 'cover',
    });
    expect(course.id).toBeDefined();

    const updated = websiteService.saveWebsiteCourse({
      id: course.id,
      title: 'Node.js Backend Masterkurs (Yangilangan)',
      price: '600,000 so‘m/oy',
    });
    expect(updated.title).toContain('Yangilangan');

    websiteService.deleteWebsiteCourse(course.id);
    const list = websiteService.getWebsiteCourses(false);
    expect(list.find((c) => c.id === course.id)).toBeUndefined();
  });

  it('C) Fan (Subject): Yaratish, Tahrirlash, O‘chirish', () => {
    const subject = websiteService.saveWebsiteSubject({
      name: 'Sunʼiy Intellekt va Neyrotarmoqlar',
      coursesCount: 3,
      courses_count: 3,
      icon_name: 'Cpu',
      color: 'from-purple-600 to-pink-600',
      description: 'Machine Learning, Deep Learning va LLM asoslari.',
    });
    expect(subject.id).toBeDefined();

    const updated = websiteService.saveWebsiteSubject({
      id: subject.id,
      name: 'Sunʼiy Intellekt (Tahrirlangan)',
      coursesCount: 5,
    });
    expect(updated.name).toContain('Tahrirlangan');

    websiteService.deleteWebsiteSubject(subject.id);
    const list = websiteService.getWebsiteSubjects(false);
    expect(list.find((s) => s.id === subject.id)).toBeUndefined();
  });

  it('D) Ustoz (Teacher): Yaratish, Tahrirlash, O‘chirish', () => {
    const teacher = websiteService.saveWebsiteTeacher({
      name: 'Bobur Mirzayev',
      role: 'Senior Python Developer',
      experience: '7+ yil',
      subject: 'Python & Django',
      rating: 5,
      photo: 'https://example.com/teacher.jpg',
      fit_mode: 'cover',
      object_position: 'top',
    });
    expect(teacher.id).toBeDefined();

    const updated = websiteService.saveWebsiteTeacher({
      id: teacher.id,
      name: 'Bobur Mirzayev (Lead)',
      rating: 4.9,
    });
    expect(updated.name).toContain('Lead');

    websiteService.deleteWebsiteTeacher(teacher.id);
    const list = websiteService.getWebsiteTeachers(false);
    expect(list.find((t) => t.id === teacher.id)).toBeUndefined();
  });

  it('E) Yangilik (News): Yaratish, Tahrirlash, O‘chirish', () => {
    const news = websiteService.saveWebsiteNews({
      title: 'Olimpiada natijalari eʼlon qilindi',
      category: 'Yutuqlar',
      summary: 'Talabalarimiz 1-o‘rinni egalladi.',
      date: '2026-11-02',
      published_at: '2026-11-02',
    });
    expect(news.id).toBeDefined();

    const updated = websiteService.saveWebsiteNews({
      id: news.id,
      title: 'Olimpiada natijalari (Yangilangan)',
    });
    expect(updated.title).toContain('Yangilangan');

    websiteService.deleteWebsiteNews(news.id);
    const list = websiteService.getWebsiteNews(false);
    expect(list.find((n) => n.id === news.id)).toBeUndefined();
  });

  it('F) Video (Video): Yaratish, Tahrirlash, O‘chirish', () => {
    const video = websiteService.saveWebsiteVideo({
      title: 'Harakatdagi laboratoriya',
      category: 'Amaliyot',
      duration: '03:15',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail: 'https://example.com/thumb.jpg',
    });
    expect(video.id).toBeDefined();

    const updated = websiteService.saveWebsiteVideo({
      id: video.id,
      title: 'Harakatdagi laboratoriya (Yangi video)',
      duration: '04:00',
    });
    expect(updated.title).toContain('Yangi');

    websiteService.deleteWebsiteVideo(video.id);
    const list = websiteService.getWebsiteVideos(false);
    expect(list.find((v) => v.id === video.id)).toBeUndefined();
  });

  it('G) Galereya (Gallery): Yaratish, Tahrirlash, O‘chirish', () => {
    const item = websiteService.saveWebsiteGalleryItem({
      title: 'Hakaton final bosqichi',
      category: 'Tadbirlar',
      image: 'https://example.com/gallery.jpg',
      fit_mode: 'cover',
    });
    expect(item.id).toBeDefined();

    const updated = websiteService.saveWebsiteGalleryItem({
      id: item.id,
      title: 'Hakaton final bosqichi (Gʻoliblar taqdirlandi)',
    });
    expect(updated.title).toContain('Gʻoliblar');

    websiteService.deleteWebsiteGalleryItem(item.id);
    const list = websiteService.getWebsiteGallery(false);
    expect(list.find((g) => g.id === item.id)).toBeUndefined();
  });

  it('H) Fikr va Sharh (Testimonial): Yaratish, Tahrirlash, O‘chirish', () => {
    const test = websiteService.saveWebsiteTestimonial({
      name: 'Munira Karimova',
      role: 'Grafik dizayner',
      quote: 'Kurslar menga yangi kasb berdi.',
      rating: 5,
    });
    expect(test.id).toBeDefined();

    const updated = websiteService.saveWebsiteTestimonial({
      id: test.id,
      name: 'Munira Karimova (Junior UI/UX)',
      quote: 'Juda zoʻr kurslar!',
    });
    expect(updated.name).toContain('Junior');

    websiteService.deleteWebsiteTestimonial(test.id);
    const list = websiteService.getWebsiteTestimonials(false);
    expect(list.find((t) => t.id === test.id)).toBeUndefined();
  });
});
