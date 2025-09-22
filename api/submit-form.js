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

  try {
    // 1. Supabase에 데이터 저장
    const { error: supabaseError } = await supabase
      .from('new_contact') // Supabase 테이블 이름
      .insert({ name, email, phone });

    if (supabaseError) throw supabaseError;

    // 2. 구글 시트에 데이터 추가
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "'looplanding_data'!A1", // 시트 이름과 범위
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[name, email, phone]],
      },
    });

    // 3. 클라이언트에게 알림 메일 발송
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CLIENT_EMAIL,
      subject: `새 문의가 접수되었습니다: ${name}`,
      html: `<p>이름: ${name}</p><p>이메일: ${email}</p><p>전화번호: ${phone}</p>`,
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
}