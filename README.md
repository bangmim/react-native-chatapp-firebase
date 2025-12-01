## ChatApp

텍스트, 이미지, 음성 메시지를 전송할 수 있는 **실시간 1:1 채팅 앱**입니다.  
Firebase( Authentication · Firestore · Storage )를 기반으로 **별도 서버 없이** 구현한 모바일 메신저 프로젝트입니다.
## 구현 영상 (Preview)
| <img src="assets/preview.gif" width="300" /> |
[![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/cbqwafX-eoA)
---

## 주요 기능 (Features)

- **인증 & 사용자 관리**

  - 이메일 기반 회원가입 / 로그인
  - 회원가입 시 입력 검증(이메일 형식, 비밀번호 길이/일치 여부 등)
  - 프로필 이미지 업로드 및 수정

- **채팅**

  - 1:1 채팅방 생성 및 로드
  - 텍스트, 이미지, 음성 메시지 전송
  - 실시간 메시지 수신 (Firestore `onSnapshot`)
  - 메시지 읽음 처리 및 **안 읽은 사용자 수 표시**

- **미디어 처리**

  - 갤러리에서 이미지 선택 후 크롭 → 프로필 / 이미지 메시지로 사용
  - 음성 녹음 및 재생, Firebase Storage 업로드
  - 권한 거절 시 **안내 모달**로 설정 진입 유도

- **UX / 안정성**
  - 입력값 검증에 따른 버튼 활성/비활성
  - 로딩 상태에 따른 인디케이터 처리
  - 권한 요청(카메라/앨범/마이크) 및 거절 케이스 핸들링

> 추후 확장 방향: FCM 기반 푸시 알림, 그룹 채팅, 메시지 검색, 차단/신고 등

---

## 기술 스택 (Tech Stack)

- **App**

  - React Native (TypeScript, CLI 템플릿)
  - React Navigation (Stack Navigator)
  - `react-native-image-crop-picker` (이미지 선택/크롭)
  - `react-native-image-viewing` (이미지 확대/뷰어)
  - `react-native-audio-recorder-player` (음성 녹음/재생)
  - `react-native-permissions` (권한 관리)
  - `dayjs`, `lodash`, `validator`, FontAwesome Icons 등

- **Backend (BaaS)**

  - Firebase Authentication
  - Cloud Firestore
  - Cloud Storage
  - (향후) Cloud Functions, Cloud Messaging(FCM)

- **개발 환경**
  - Node.js / npm
  - Android Studio, Xcode
  - ESLint, Prettier, TypeScript

---

## 아키텍처 & 데이터 모델

- **폴더 구조 (요약)**

  - `src/SigninScreen`, `src/SignupScreen` : 인증 화면
  - `src/HomeScreen` : 사용자 목록, 내 정보/프로필 관리
  - `src/ChatScreen` : 채팅 화면, 메시지/미디어 전송
  - `src/components` : 공용 컴포넌트 (`Screen`, `UserPhoto`, `AuthProvider` 등)
  - `src/types.ts` : 공용 타입 정의

- **상태 관리**

  - `AuthProvider` + `AuthContext`  
    → Firebase Auth 상태를 전역에서 공유 (로그인/로그아웃, 프로필 이미지 갱신 등)
  - `useChat` 커스텀 훅  
    → 채팅방 로드, 메시지 전송, 이미지/음성 업로드, 읽음 처리 로직을 한 곳에서 관리

- **Firestore 컬렉션 설계**
  - `users`
    - `userId`, `email`, `name`, `profileUrl`
  - `chats`
    - `userIds: string[]` (참여자 id 정렬 배열)
    - `users: User[]` (참여자 정보 캐싱)
    - `userToMessageReadAt.{userId}: Timestamp` (유저별 마지막 읽은 시간)
  - `chats/{chatId}/messages`
    - `text | imageUrl | audioUrl`
    - `user` (보낸 사람 정보)
    - `createdAt` (서버 타임스탬프)

---

## 구현 상세 (What I did)

### 1. 인증 플로우

- **회원가입**
  - 이메일/비밀번호/이름 입력
  - `validator`를 활용한 입력값 검증
  - Firebase Auth로 계정 생성 후, Firestore `users` 컬렉션에 유저 정보 저장
- **로그인**
  - 이메일/비밀번호 유효성 검사
  - 잘못된 입력일 때 버튼 비활성화 및 에러 메시지 표시

### 2. 홈 화면

- 로그인된 사용자 정보 표시 및 **로그아웃 기능**
- Firestore에서 다른 사용자 목록 로드 → `FlatList`로 렌더링
- 본인 프로필 영역에서 이미지 변경:
  - `react-native-image-crop-picker`로 이미지 선택 및 원형 크롭
  - Firebase Storage 업로드 후 다운로드 URL을 `users` 문서와 Auth 프로필에 반영

### 3. 채팅 기능

- `useChat` 훅에서
  - 두 사용자의 `userIds` 배열을 정렬하여 **채팅방 키** 생성
  - 기존 채팅방 존재 시 로드, 없으면 새로 생성
- 메시지 전송
  - Firestore 서브컬렉션(`chats/{chatId}/messages`)에 메시지 문서 추가
  - `onSnapshot` 으로 실시간 수신 및 `FlatList`에 반영 (inverted 리스트)
- 메시지 읽음 처리
  - 채팅방 진입 시 `userToMessageReadAt` 에 서버 타임스탬프로 기록
  - 각 메시지의 `createdAt` 과 비교해 **안 읽은 사용자 수** 계산 및 표시

### 4. 이미지 / 음성 메시지

- **이미지**

  - 갤러리에서 크롭 후 Storage 업로드 → 다운로드 URL을 메시지 문서에 저장
  - 썸네일 + 전체 화면 뷰어(`react-native-image-viewing`) 구현

- **음성**
  - `react-native-audio-recorder-player`로 녹음/정지 제어
  - 파일을 Storage에 업로드 후 다운로드 URL을 메시지로 전송

### 5. 권한 처리 & UX

- **마이크 권한**

  - Android: `PermissionsAndroid`, iOS: `react-native-permissions`
  - 권한 거절 시 시스템 팝업뿐만 아니라,  
    “설정에서 마이크 권한을 허용해 달라”는 **안내 Alert**를 추가

- **갤러리/사진 권한**
  - 이미지 선택 시 에러 코드(`E_PICKER_CANCELLED`)에 따라
    - 사용자가 단순 취소한 경우는 조용히 무시
    - 권한 문제 등 오류 시 안내 Alert로 다음 행동을 알려줌

---

## 실행 방법 (Getting Started)

1. **의존성 설치**

   ```bash
   npm install
   ```

   (필요 시)

   ```bash
   npm install --save @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage
   npm install --save react-native-image-crop-picker react-native-image-viewing react-native-audio-recorder-player react-native-permissions
   ```

2. **Firebase 설정**

   - Firebase 프로젝트 생성 후
   - Android: `android/app/google-services.json` 추가
   - iOS: `ios/GoogleService-Info.plist` 추가
   - Firestore / Storage 보안 규칙을 개발용으로 설정  
     (예: 로그인 사용자만 읽기/쓰기 허용)

3. **iOS 세팅**

   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **앱 실행**

   ```bash
   npm run android
   # 또는
   npm run ios
   ```

---

## 트러블슈팅 & 학습 포인트

- Firebase 보안 규칙 만료로 인한 `permission-denied` 문제를
  - 테스트 규칙 → 로그인 사용자 기반 규칙으로 리팩토링
- Android / iOS 권한 체계 차이로 인한
  - 마이크/갤러리 권한 팝업 미노출, 권한 거절 후 동작 불능 문제를
  - 플랫폼별 권한 요청 + 안내 모달로 해결
- 멀티미디어(이미지, 음성) 업로드 시
  - 파일 이름 충돌 방지(타임스탬프 기반), 경로 설계(`chat/{chatId}/{filename}`) 등을 고려해 구현

이 프로젝트는 **실제 메신저 서비스의 축소판**을 목표로 하여,  
실시간 통신, 권한 관리, 멀티미디어 처리, Firebase 보안 규칙 설계까지 경험한 결과물입니다.
