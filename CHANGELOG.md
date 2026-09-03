# Changelog

## 1.1.31

### Fixed

- **정렬/검색/필터로 목록을 1페이지로 되돌린 뒤 무한 스크롤이 영구히 멈추던 문제를 수정했습니다.** (1.1.29 회귀)
  - 1.1.29 가 "바닥 떨림"(서버 소진 후 `onLoadMore` 무한 반복)을 막으려고 넣은 더보기 잠금(`lastLoadMoreLengthRef`)이, 목록 교체로 길이가 우연히 같아지면(예: page2 로 늘렸다가 정렬로 다시 50건) `요청한 길이 === 현재 길이`가 되어 `onLoadMore` 를 다시 호출하지 않고 데드락됐습니다.
  - 이미 있던 '진짜 교체' 판별(첫 행 식별자 + 길이)에 맞춰, **교체가 감지되면 더보기 잠금을 함께 해제**하도록 했습니다. append·서버 소진(빈 응답)은 교체로 보지 않으므로 1.1.29 가 고친 바닥 떨림은 재발하지 않습니다.

  Fixed a deadlock (regression from 1.1.29) where infinite scroll permanently stopped after sort/search/filter reset the list to page 1: the load-more latch is now released when a genuine data replacement is detected (first-row id / length), while append and exhausted-server (empty) responses still keep the latch so the 1.1.29 bottom-jitter fix stays intact.

> 참고: npm 에 1.1.30 이 있었으나 1.1.29 와 동일 커밋의 버전업(코드 변경 없음)이라, 이 수정은 1.1.31 로 배포합니다.

## 1.1.29

### Fixed

- **무한 스크롤 바닥에서 목록이 떨리고 맨 위로 튀던 문제를 수정했습니다.**
  - `data` 참조가 바뀌면 길이만 보고 "정렬/필터로 교체됐다"고 오판해 `scrollToIndex(0)`(맨 위)로 스크롤하던 로직을, **첫 행 식별자(`getRowId`)와 길이로 '진짜 교체' 여부를 판별**하도록 바꿨습니다. 체크박스 토글·무한 스크롤 빈 결과·부모 리렌더로 같은 목록의 새 배열이 내려와도 스크롤 위치를 유지합니다. (정렬/필터 등 실제 교체 시에는 그대로 맨 위로 이동)
  - 바닥에 도달한 뒤 서버에 더 이상 데이터가 없어도 `endReached ↔ onLoadMore`가 무한 반복되던 문제를 막았습니다. **직전 요청 이후 데이터 길이가 늘지 않았으면 같은 길이로는 `onLoadMore`를 다시 호출하지 않습니다.**

  Fixed list jitter / jump-to-top at the bottom of infinite scroll: the scroll-to-top on data change now only triggers on a genuine replacement (first-row id or length change) instead of any new same-length array, and `onLoadMore` is no longer called repeatedly at the bottom once the data length stops growing.

> 참고: 1.1.27 / 1.1.28 은 git 커밋 없이 npm 에만 배포된 버전으로, 데이터 행 높이의 서브픽셀로 인해 sticky 합계행(`<tfoot>`)이 1px 떨리던 문제를 수정(행 높이를 `estimatedItemHeight` 로 정수 고정, footer 셀 높이 고정 및 border→inset box-shadow)한 내용이었습니다. 이 1.1.29 릴리스에 해당 수정이 함께 포함되어 git 과 npm 이 다시 일치합니다.
