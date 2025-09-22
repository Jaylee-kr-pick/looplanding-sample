document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            // 폼의 기본 제출 동작(새로고침)을 막습니다.
            e.preventDefault();

            // 폼에 입력된 데이터를 객체로 만듭니다.
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value
            };

            // 폼 제출 버튼을 비활성화하여 중복 제출을 막습니다.
            const submitButton = contactForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = '전송 중...';

            try {
                // Vercel 서버리스 함수로 데이터를 보냅니다.
                const response = await fetch('/api/submit-form', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                // 응답이 성공(200 OK)인지 확인합니다.
                if (response.ok) {
                    alert('문의가 성공적으로 접수되었습니다!');
                    contactForm.reset(); // 폼 필드 초기화
                } else {
                    throw new Error('서버 오류가 발생했습니다.');
                }
            } catch (error) {
                console.error('문의 제출 실패:', error);
                alert('문의 제출에 실패했습니다. 다시 시도해주세요.');
            } finally {
                // 작업이 끝나면 버튼을 다시 활성화합니다.
                submitButton.disabled = false;
                submitButton.textContent = '문의하기';
            }
        });
    }
});