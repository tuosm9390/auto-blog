import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from "@react-email/components";

interface Props {
  githubUsername: string;
}

export default function TesterApplyConfirm({ githubUsername }: Props) {
  return (
    <Html lang="ko">
      <Head />
      <Body style={{ fontFamily: "sans-serif", background: "#f9f9f9" }}>
        <Container
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: 32,
            background: "#fff",
            borderRadius: 8,
          }}
        >
          <Heading style={{ color: "#0f172a", fontSize: 24, marginBottom: 16 }}>
            테스터 신청 접수 완료
          </Heading>
          <Text style={{ color: "#334155", fontSize: 16 }}>
            안녕하세요, <strong>{githubUsername}</strong>님!
          </Text>
          <Text style={{ color: "#334155", fontSize: 16 }}>
            Synapso.dev 테스터 신청이 정상적으로 접수되었습니다.
          </Text>
          <Text style={{ color: "#334155", fontSize: 16 }}>
            관리자 검토 후 결과를 이메일로 안내드릴 예정입니다. 보통 2~3 영업일
            내에 처리됩니다.
          </Text>
          <Hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>
            본 이메일은 Synapso.dev에서 자동 발송된 메일입니다. 문의사항이
            있으시면 서비스 내 문의하기를 이용해 주세요.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
