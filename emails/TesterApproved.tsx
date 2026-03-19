import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface Props {
  githubUsername: string;
}

export default function TesterApproved({ githubUsername }: Props) {
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
            테스터 승인 안내 🎉
          </Heading>
          <Text style={{ color: "#334155", fontSize: 16 }}>
            안녕하세요, <strong>{githubUsername}</strong>님!
          </Text>
          <Text style={{ color: "#334155", fontSize: 16 }}>
            Synapso.dev 테스터로 승인되셨습니다. 이제 테스터 전용 기능을
            이용하실 수 있습니다.
          </Text>
          <Text style={{ color: "#334155", fontSize: 16 }}>
            지금 바로 서비스에 접속하여 새로운 기능을 경험해 보세요!
          </Text>
          <Button
            href="https://synapso.dev"
            style={{
              display: "inline-block",
              background: "#0f172a",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 6,
              fontSize: 15,
              fontWeight: "bold",
              textDecoration: "none",
              margin: "16px 0",
            }}
          >
            서비스 바로가기
          </Button>
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
