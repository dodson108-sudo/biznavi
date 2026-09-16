/**
 * BizNavi AI — 업종 특화 진단
 * facility_service — 시설관리·경비 (FM·빌딩관리·경비·청소대행·방역·소독)
 *
 * ⚠ DiagMicro의 facility_service 그룹(맞춤진단 35문항)과 축이 겹치지 않게 설계했다.
 *    맞춤진단 = 경영 관리 수준 (실질 인건비·계약별 수익성·관리 실적·갱신·근태 기록)
 *    업종 특화 = 현장 실행 수준 (배치 설계·작업 표준·안전 이행·발주처 운영)
 * ⚠ FM·빌딩관리·경비·청소·방역을 모두 포괄한다. 한쪽 전용어(순찰·약품·구역)는
 *    question에 쓰지 않고 scale 서술에서 예시로만 다룬다.
 * ⚠ 영어 약자를 쓰지 않는다.
 */
const INDUSTRY_FACILITY_SERVICE = {
  id: 'facility_service',
  label: '시설관리·경비',
  icon: '🏢',
  description: '건물 시설관리·경비·청소대행·방역 등 정기 도급 서비스 업체. 인건비가 원가의 대부분이며, 계약한 인원이 약속한 시간에 현장에 있는 것 자체가 납품물이다.',
  areas: [
    {
      id: 'fs_staffing',
      label: '현장 배치·교대 운영',
      icon: '👥',
      items: [
        { id:'fs_1_1', label:'배치 인원 산정 근거', type:'bars',
          question:'현장마다 몇 명이 필요한지를 면적·설비 범위·근무 형태로 계산해서 정하십니까, 아니면 경험과 감으로 정하십니까?',
          scale:[
            {score:1,desc:'발주처가 제시한 인원을 그대로 받아들이며 자체 산정 근거가 없음.'},
            {score:2,desc:'비슷한 현장 경험으로 대략 정하며 계산 과정을 남기지 않음.'},
            {score:3,desc:'면적이나 근무 시간 중 한 가지 기준으로만 산정함.'},
            {score:4,desc:'면적·설비 범위·근무 형태를 함께 반영한 산정표로 필요 인원을 계산함.'},
            {score:5,desc:'산정표를 실제 투입 실적과 대조해 주기적으로 보정하고 견적 근거로 제시함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_staffing_basis_none'} },
        { id:'fs_1_2', label:'교대 인수인계 체계', type:'bars',
          question:'근무자가 교대할 때 직전 근무 중 있었던 일과 이어서 처리할 사항이 빠짐없이 전달되는 절차가 있습니까?',
          scale:[
            {score:1,desc:'인수인계 절차가 없어 교대 후 앞선 상황을 알지 못함.'},
            {score:2,desc:'구두로만 전달하며 기록이 남지 않아 누락이 잦음.'},
            {score:3,desc:'인계 양식은 있으나 형식적으로 작성되어 실제 내용이 부실함.'},
            {score:4,desc:'인계 항목을 정해 두고 교대마다 기록하며 미처리 건이 이월됨.'},
            {score:5,desc:'인계 기록을 관리자가 확인하고 반복되는 미처리 건은 절차 개선으로 연결함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_handover_weak'} },
        { id:'fs_1_3', label:'현장 책임자 권한 범위', type:'bars',
          question:'현장마다 책임자가 지정되어 있고, 그 사람이 즉시 판단할 수 있는 범위가 정해져 있습니까?',
          scale:[
            {score:1,desc:'책임자가 따로 없어 모든 판단을 대표에게 물어봐야 함.'},
            {score:2,desc:'호칭상 책임자는 있으나 실제 권한이 없어 전달자 역할에 그침.'},
            {score:3,desc:'책임자를 지정했으나 어디까지 결정할 수 있는지 기준이 모호함.'},
            {score:4,desc:'판단 범위와 보고 기준이 문서로 정해져 있어 현장에서 즉시 대응함.'},
            {score:5,desc:'권한 범위를 정기 점검해 조정하고 책임자 대상 교육을 별도로 운영함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_site_authority_none'} },
        { id:'fs_1_4', label:'다현장 동시 관리 부담', type:'bars',
          question:'관리자 한 사람이 몇 개 현장을 맡는지, 이동 시간까지 포함해 감당 가능한 수준인지 확인하고 계십니까?',
          scale:[
            {score:1,desc:'담당 현장 수를 따로 세어 보지 않고 늘어나는 대로 맡김.'},
            {score:2,desc:'현장 수는 알지만 이동 시간이나 방문 주기는 고려하지 않음.'},
            {score:3,desc:'담당 현장 수는 관리하나 관리자별 부담 편차가 큼.'},
            {score:4,desc:'이동 거리와 방문 주기를 반영해 담당 현장을 배분하고 상한을 둠.'},
            {score:5,desc:'관리자별 부담과 현장 민원 발생률을 함께 보고 배분을 조정함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_span_overload'} },
      ]
    },
    {
      id: 'fs_quality',
      label: '작업 표준·품질 증빙',
      icon: '📋',
      items: [
        { id:'fs_2_1', label:'업무 범위 표준서', type:'bars',
          question:'계약에 포함되는 업무와 포함되지 않는 업무가 문서로 구분되어 현장 근무자까지 공유되어 있습니까?',
          scale:[
            {score:1,desc:'범위를 문서로 정하지 않아 발주처가 요구하는 대로 받아들임.'},
            {score:2,desc:'계약서에 큰 항목만 적혀 있고 세부 범위는 현장 판단에 맡김.'},
            {score:3,desc:'범위 문서는 있으나 근무자에게 전달되지 않아 현장에서 모름.'},
            {score:4,desc:'포함·제외 업무를 문서로 구분하고 근무자에게 배포해 기준을 공유함.'},
            {score:5,desc:'범위를 넘는 요청이 들어오면 별도 청구 기준까지 정해 두고 실제로 적용함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_scope_undefined'} },
        { id:'fs_2_2', label:'작업 주기표·점검표', type:'bars',
          question:'일·주·월·분기 단위로 무엇을 언제 해야 하는지 정한 주기표와 확인용 점검표를 운영하십니까?',
          scale:[
            {score:1,desc:'주기표가 없어 그날그날 상황에 따라 처리함.'},
            {score:2,desc:'대략의 주기는 알지만 문서로 정리되어 있지 않음.'},
            {score:3,desc:'주기표는 있으나 수행 여부를 확인하지 않아 누락이 생김.'},
            {score:4,desc:'주기표와 점검표를 함께 운영하며 누락 시 재수행을 지시함.'},
            {score:5,desc:'누락 항목을 모아 원인을 분석하고 주기·인력 배분에 반영함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_cycle_plan_none'} },
        { id:'fs_2_3', label:'발주처 확인 요청 대응', type:'bars',
          question:'발주처가 "제대로 했는지 보여 달라"고 할 때 수행 기록을 바로 제출할 수 있습니까?',
          scale:[
            {score:1,desc:'제출할 기록이 없어 구두로 설명하는 수밖에 없음.'},
            {score:2,desc:'수기 기록은 있으나 흩어져 있어 모으는 데 며칠이 걸림.'},
            {score:3,desc:'기록은 모이지만 형식이 제각각이라 그대로 내기 어려움.'},
            {score:4,desc:'정해진 형식으로 기록이 쌓여 요청 당일 제출이 가능함.'},
            {score:5,desc:'사진·시각 정보까지 포함한 기록을 정기 보고에 함께 제출해 요청 자체가 줄었음.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_evidence_weak'} },
        { id:'fs_2_4', label:'소모품·장비 사용 기준', type:'bars',
          question:'사용하는 소모품과 장비의 품목·용량·교체 주기가 정해져 있고 그대로 쓰이는지 확인하십니까?',
          scale:[
            {score:1,desc:'현장에서 알아서 쓰게 두어 무엇을 얼마나 쓰는지 파악되지 않음.'},
            {score:2,desc:'품목은 정했으나 사용량과 교체 주기는 관리하지 않음.'},
            {score:3,desc:'사용량을 집계하나 현장별 차이의 원인을 확인하지 않음.'},
            {score:4,desc:'품목·용량·주기를 정해 두고 실제 사용량과 대조함(예: 세제·소모 자재·장비 부품).'},
            {score:5,desc:'사용량 추이로 과다·과소 사용 현장을 찾아 교육과 발주 계획에 반영함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_supply_standard_none'} },
      ]
    },
    {
      id: 'fs_safety',
      label: '안전·법정 의무 이행',
      icon: '⚠️',
      items: [
        { id:'fs_3_1', label:'작업 전 위험 확인', type:'bars',
          question:'그날 작업을 시작하기 전에 위험 요소를 확인하고 근무자와 공유하는 절차가 있습니까?',
          scale:[
            {score:1,desc:'작업 전 확인 절차가 없고 사고가 나면 그때 대응함.'},
            {score:2,desc:'위험한 곳은 알고 있으나 근무자에게 그때그때 말로만 전달함.'},
            {score:3,desc:'주의 사항을 전달하지만 현장·작업 종류별로 구분되어 있지 않음.'},
            {score:4,desc:'작업 종류별 위험 항목을 정해 시작 전 확인하고 공유함(예: 높은 곳 작업·전기 설비·밀폐 공간).'},
            {score:5,desc:'확인 결과를 기록하고 위험이 반복되는 지점은 작업 방식 자체를 바꿈.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_pretask_check_none'} },
        { id:'fs_3_2', label:'사고 보고·처리 절차', type:'bars',
          question:'사고나 손해가 발생했을 때 누구에게 언제까지 무엇을 알리고 어떻게 처리하는지 정해져 있습니까?',
          scale:[
            {score:1,desc:'절차가 없어 사고 때마다 대응 방식이 달라짐.'},
            {score:2,desc:'대표에게 알린다는 정도만 있고 이후 처리 방법은 정해져 있지 않음.'},
            {score:3,desc:'보고 절차는 있으나 발주처 통보 시점과 방법이 불명확함.'},
            {score:4,desc:'보고 대상·기한·처리 순서를 문서로 정하고 근무자에게 배포함.'},
            {score:5,desc:'사고 사례를 모아 원인별로 정리하고 예방 조치를 작업 기준에 반영함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_incident_process_none'} },
        { id:'fs_3_3', label:'보호구 지급·착용 관리', type:'bars',
          question:'작업에 필요한 보호구를 지급하고 실제로 착용하는지 확인하십니까?',
          scale:[
            {score:1,desc:'보호구를 지급하지 않거나 근무자가 알아서 준비하도록 둠.'},
            {score:2,desc:'지급은 하지만 어떤 작업에 무엇이 필요한지 정해져 있지 않음.'},
            {score:3,desc:'작업별 필요 보호구는 정했으나 착용 여부를 확인하지 않음.'},
            {score:4,desc:'지급 기록을 남기고 현장 점검 시 착용 여부를 함께 확인함.'},
            {score:5,desc:'교체 주기까지 관리하며 훼손·분실 시 즉시 재지급되는 체계를 갖춤.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_ppe_unmanaged'} },
        { id:'fs_3_4', label:'법정 교육·신고 기한 관리', type:'bars',
          question:'업종에 따라 정기적으로 받아야 하는 교육과 제출해야 하는 신고·보고의 기한을 관리하고 계십니까?',
          scale:[
            {score:1,desc:'무엇을 언제까지 해야 하는지 파악하지 못해 기한이 지난 뒤에 알게 됨.'},
            {score:2,desc:'해야 한다는 것은 알지만 기한을 별도로 관리하지 않음.'},
            {score:3,desc:'기한을 기억에 의존해 관리하며 담당자가 바뀌면 누락됨.'},
            {score:4,desc:'항목별 기한을 달력에 등록해 사전에 알림을 받고 처리함(예: 근무자 정기 교육·영업 신고 사항).'},
            {score:5,desc:'이수·제출 기록을 인원별·항목별로 보관해 발주처 확인 요청에 즉시 대응함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_legal_deadline_unmanaged'} },
      ]
    },
    {
      id: 'fs_client',
      label: '발주처 운영·현장 이관',
      icon: '🤝',
      items: [
        { id:'fs_4_1', label:'정기 보고 체계', type:'bars',
          question:'발주처에 월간 수행 실적을 정해진 형식으로 먼저 보고하십니까, 아니면 요청이 올 때만 대응하십니까?',
          scale:[
            {score:1,desc:'정기 보고를 하지 않고 문제가 생겼을 때만 연락함.'},
            {score:2,desc:'요청이 오면 그때 자료를 만들어 제출함.'},
            {score:3,desc:'정기 보고는 하지만 형식이 매번 달라 비교가 되지 않음.'},
            {score:4,desc:'정해진 형식으로 월간 실적을 먼저 제출해 발주처가 상황을 파악함.'},
            {score:5,desc:'보고서에 개선 제안과 다음 달 계획까지 담아 재계약 근거로 활용함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_report_none'} },
        { id:'fs_4_2', label:'요청사항 반영 이력', type:'bars',
          question:'발주처가 요청한 사항을 기록하고, 어떻게 처리했는지 결과를 다시 알려 드리십니까?',
          scale:[
            {score:1,desc:'요청을 기록하지 않아 무엇을 요구받았는지 나중에 확인할 수 없음.'},
            {score:2,desc:'기억에 의존해 처리하며 같은 요청이 반복되어도 알지 못함.'},
            {score:3,desc:'요청은 기록하나 처리 결과를 회신하지 않아 신뢰가 쌓이지 않음.'},
            {score:4,desc:'요청·처리·회신을 한 곳에 기록해 진행 상황을 함께 확인함.'},
            {score:5,desc:'반복 요청을 유형별로 정리해 작업 기준이나 계약 범위 조정으로 연결함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_request_log_none'} },
        { id:'fs_4_3', label:'신규 현장 인수 점검', type:'bars',
          question:'새 현장을 맡을 때 기존 상태와 인계 사항을 점검하고 기록으로 남기십니까?',
          scale:[
            {score:1,desc:'인수 점검 없이 바로 투입해 기존 문제까지 우리 책임이 됨.'},
            {score:2,desc:'둘러보기는 하지만 기록을 남기지 않아 나중에 다투게 됨.'},
            {score:3,desc:'점검은 하나 항목이 정해져 있지 않아 담당자마다 범위가 다름.'},
            {score:4,desc:'인수 점검 항목을 정해 상태를 사진과 함께 기록하고 발주처와 공유함.'},
            {score:5,desc:'인수 기록을 기준으로 초기 개선 과제를 제안해 계약 초반 신뢰를 확보함.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_takeover_check_none'} },
        { id:'fs_4_4', label:'계약 종료 정리 절차', type:'bars',
          question:'계약이 끝날 때 보유 자산 회수, 인력 재배치, 서류 인계가 정해진 순서대로 진행됩니까?',
          scale:[
            {score:1,desc:'종료 절차가 없어 장비가 남거나 인력이 갈 곳 없이 대기함.'},
            {score:2,desc:'자산 회수만 챙기고 인력 재배치는 그때 상황에 맡김.'},
            {score:3,desc:'대략의 순서는 있으나 문서화되어 있지 않아 매번 달라짐.'},
            {score:4,desc:'자산·인력·서류 각각의 정리 절차를 문서로 두고 순서대로 진행함.'},
            {score:5,desc:'종료 전에 인력 재배치처를 미리 확보해 숙련 인력 이탈을 막음.'},
          ],
          ai_trigger:{threshold:2,warning:'fs_exit_process_none'} },
      ]
    },
  ],
  ai_analysis: [
    { trigger:'fs_staffing_basis_none+fs_span_overload', level:'CRITICAL',
      msg:'배치 인원을 감으로 정하는데 관리자 담당 현장까지 과다하면, 계약 단가가 맞지 않는다는 사실을 아무도 알아채지 못하는 구조입니다. 산정표부터 만들어 현장별 필요 인원을 다시 계산하고 관리자 담당 상한을 정하십시오.' },
    { trigger:'fs_scope_undefined+fs_request_log_none', level:'CRITICAL',
      msg:'업무 범위가 문서로 정해져 있지 않은데 요청 이력까지 남기지 않으면, 계약에 없는 일이 조금씩 늘어나도 근거를 댈 수 없습니다. 포함·제외 업무를 먼저 문서로 구분하고 요청은 반드시 기록으로 받으십시오.' },
    { trigger:'fs_evidence_weak+fs_report_none', level:'HIGH',
      msg:'수행 기록을 바로 내지 못하는데 정기 보고도 하지 않으면, 발주처는 일이 되고 있는지 확인할 방법이 없습니다. 갱신 시점에 가격 외에 내세울 근거가 남지 않으므로 기록 형식부터 통일하십시오.' },
    { trigger:'fs_pretask_check_none+fs_ppe_unmanaged', level:'HIGH',
      msg:'작업 전 위험 확인도 보호구 관리도 없는 상태입니다. 사고가 나면 책임 범위를 다투기 전에 예방 조치를 하지 않은 사실이 먼저 문제가 됩니다. 작업 종류별 위험 항목과 필요 보호구를 정하는 것이 우선입니다.' },
    { trigger:'fs_handover_weak+fs_incident_process_none', level:'HIGH',
      msg:'인수인계가 부실한데 사고 보고 절차까지 없으면, 문제가 생겼을 때 언제 무슨 일이 있었는지 재구성할 수 없습니다. 교대 기록과 보고 절차를 함께 세우십시오.' },
    { trigger:'fs_takeover_check_none+fs_exit_process_none', level:'MEDIUM',
      msg:'현장 인수와 종료 절차가 모두 없으면 계약 시작과 끝에서 매번 손실이 발생합니다. 인수 시 상태 기록과 종료 시 자산·인력 정리 순서를 문서로 만드십시오.' },
  ],
};
if (typeof window !== 'undefined') window.INDUSTRY_FACILITY_SERVICE = INDUSTRY_FACILITY_SERVICE;
if (typeof module !== 'undefined') module.exports = INDUSTRY_FACILITY_SERVICE;
