# ChatApp

- 텍스트, 이미지 및 음성 메시지를 전송할 수 있는 1:1 채팅앱
- 기능
  (1)회원가입, 로그인
  (2)프로필 이미지등록
  (3)사용자 리스트
  (4)채팅방
  (5)텍스트, 이미지, 오디오 메시지 전송
  (6)메시지 읽음 표시
  (7)푸시알림
- TypeScript 기반 ReactNative 프로젝트를 CLI 이용해서 초기화
- 리스트 컴포넌트를 심도있게 사용
- 멀티미디어 다루기(이미지, 오디오 녹음 및 재생)
- Firebase 이용 serverless 환경에서 앱 개발(Authentication, Firestore, Storage, CloudFunctions)
- Firebase Cloud Messaging 을 이용한 푸시 노티피케이션 전송

## 필요

- VSCode
- Android Studio
- Xcode
- ReactNative 디펜더시
- ESLint : 코드의 문법적 오류 또는 안티 패턴 등을 검사하는 도구. 버그 가능성이 있는 코드를 사전에 수정할 수 있음

- react-native cli template 를 이용한 타입스크립트 React Native 프로젝트 초기화
- hermes 사용 여부 변경
  :비활성화 -> podFile에서 hermes_enabled=>false로 변경하면 되는데, 없음
- ios 및 android 패키지 명 변경
  : android>app>src>main>java>MainActivity
- 빌드

## 설치

npm install --save @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npm i react-native-image-crop-picker --save
npm install --save react-native-image-viewing
npm install react-native-audio-recorder-player
npm install --save react-native-permissions

### OverView

1. 회원가입 스크린 구현

- react-navigation
  : npm install react-native-screens react-native-safe-area-context
  npm install @react-navigation/native
  npm install @react-navigation/native-stack
- textInput 필드 구현
- 입력한 텍스트 검증
  :npm install validator
  npm install @types/validator --dev
- 에러가 있을시 회원가입 버튼 비활성화
- Firebase Authentication 이용한 회원가입 (Authentication / Firestore Database): Context, Provider 이용

2. 로그인 스크린 구현

- TextInput 필드 구현
- 입력한 텍스트 검증
- 에러가 있을 시 로그인 버튼 비활성화
- Firebase Authentication 이용한 로그인
- 이전 스크린 네이게이션 구현 (뒤로가기 버튼)

3. 홈 스크린 구현

- 로그인 된 사용자 정보 불러오기
- 로그아웃 구현
- Firestore 이용한 데이터로드
- FlatList 이용한 사용자 리스트 구현

4. 채팅방 생성 및 로드하기

- 선택된 사용자와 채팅방 생성 및 로드
  : npm install lodash
  npm i --save-dev @types/lodash
  array의 정렬을 도와줌
- 대화 참여자 목록 구현

5. 메시지 전송 컴포넌트

- 메시지 전송 인풋 컴포넌트 구현
- 아이콘 라이브러리 이용 (fontAwsome)

6. 메시지 보내기 기능

- Firestore의 subcollection 이용해서 메시지 전송 기능 구현

7. 채팅리스트 구현

- 채팅 메시지 컴포넌트
- Inverted FlatList이용 채팅메시지 리스트 구현

8. 실시간 업데이트 (firebase-onSnapshot 이용)

- 사용하는 함수와 사용하지 않는 함수 분리

9. 프로필 이미지 등록하기

- 이미지 크롭 라이브러리 이용하여 프로필 이미지 선택
  :ImageCropPicker
  npm i react-native-image-crop-picker --save
  # ios : Info.plist-NSPhotoLibraryUsageDescription 추가
  # android :/app/build.gradle
- Firebase storage에 이미지 업로드
  : 버전에 맞지 않음.
  최신버전에 맞추어 업데이트
  (예)pod update Firebase/Auth
  //package.json에서 버전 맞추고 npm install -> pod install (pod이 꼬인 경우 > rm -rf Pods 하고 pod install)
- 사용자 프로필 이미지 설정
- 프로필 이미지 컴포넌트 구현

10. 사용자 프로필 이미지 보여주기

- 등록된 사용자 프로필 이미지 보여주기 (이미지 없는 유저는 이름의 첫글자가 보이도록 구현)
  :react-native-image-viewing (pinch zoom 가능)
  npm install --save react-native-image-viewing
- 프로필 이미지를 크게 볼 수 있는 컴포넌트 구현

11. 메시지 읽음 표시 구현

- Firestore server timestamp 를 이용하여 메시지 읽은 정보 기록
- Firestore 실시간 업데이트 이용해서 메시지 읽은 사용자 정보 실시간으로 가져오기
- 메시지 읽지 않은 사람 수 표시
  : 마지막으로 채팅방에 들어온 시간 기록, 시간 비교 (메시지 전송시간 - 채팅방에 들어온 시간)

12. 이미지 메시지 전송 기능 구현

- 갤러리에 저장된 이미지 선택
- Firesbase storage에 이미지 업로드하기
- 이미지 메시지 전송하는 컴포넌트 구현

13. 이미지 메시지 컴포넌트 구현

- 전송된 이미지 메시지 보여주기
- 이미지 메시지를 크게 볼 수 있는 기능 구현

14. 음성 메시지 전송 기능 구현

- 마이크 권한 요청
- 음성 녹음 기능 구현
- Firebase storage 에 음성 업로드하기
- 음성 메시지 전송하기
  :react-native-audio-recorder-player
  npm install react-native-audio-recorder-player
  // 권한
  npm install --save react-native-permissions
  # ios : info.plist -> permission 추가
  # android :/app/src/main/AndroidManifest.xml, android/build.gradle -> permission 추가
