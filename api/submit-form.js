import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// 환경 변수에서 API 키 및 URL 가져오기
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 구글 시트 API 클라이언트 설정
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// 이메일 발송 클라이언트 설정 (Gmail 예시)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, phone } = req.body;

  // ===== ▼▼▼ 수정된 부분 (시간 생성) ▼▼▼ =====
  // 한국 시간(KST)으로 현재 시간을 생성합니다.
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로 변환
  const kstTime = new Date(now.getTime() + kstOffset);
  const timestamp = kstTime.toISOString().replace('T', ' ').substring(0, 19);
  // ===== ▲▲▲ 수정된 부분 (시간 생성) ▲▲▲ =====

  try {
    // 1. Supabase에 데이터 저장
    const { error: supabaseError } = await supabase
      .from('new_contact') // Supabase 테이블 이름
      .insert({ name, email, phone, created_at: timestamp }); // created_at 필드에 timestamp 추가 (필드명은 실제 테이블에 맞게 수정)

    if (supabaseError) throw supabaseError;

    // 2. 구글 시트에 데이터 추가
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'loopdata!A:D', // 시트 이름과 범위
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, email, phone, timestamp]], // timestamp 추가
      },
    });

    // 3. 클라이언트에게 알림 메일 발송
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CLIENT_EMAIL,
      subject: `새 문의가 접수되었습니다: ${name}`,
      html: `<p>이름: ${name}</p><p>이메일: ${email}</p><p>전화번호: ${phone}</p><p>접수 시간: ${timestamp}</p>`, // 메일 내용에도 시간 추가
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
}