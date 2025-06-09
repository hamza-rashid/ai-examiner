import { useState, useEffect } from "react";
import {
  ChakraProvider, Box, Button, Text, Heading, VStack, Icon,
  useToast, Input, Tooltip, extendTheme, Badge, HStack, Spinner
} from "@chakra-ui/react";
import { FaFilePdf, FaUpload, FaFileAlt, FaSignOutAlt, FaHistory } from "react-icons/fa";
import { TbChecklist } from "react-icons/tb";
import { useUser } from "./AuthContext";
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";
import { logout } from "./authHelpers";
import PDFPreview from "./PDFPreview";

const theme = extendTheme({
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
});

const FaUploadIcon = FaUpload as any;
const FaFilePdfIcon = FaFilePdf as any;
const FaFileAltIcon = FaFileAlt as any;
const FaSignOutIcon = FaSignOutAlt as any;
const FaHistoryIcon = FaHistory as any;
const TbChecklistIcon = TbChecklist as any;


const MAX_FREE_CREDITS = 3;

type MarkedQuestion = {
  questionNumber: string;
  question: string;
  maxMarks: string;
  studentAnswer: string;
  mark: string;
  comment: string;
};

function App() {
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [schemeFile, setSchemeFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ questions: MarkedQuestion[]; total: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const toast = useToast({ position: 'top' });
  const user = useUser();

  const fetchUsage = async () => {
    try {
      const headers: any = {};
      if (user) {
        const token = await getIdToken(auth.currentUser!);
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("https://ai-examiner-79zf.onrender.com/usage", { headers });
      const data = await res.json();
      const used = data.credits_used || 0;
      const max = user ? 10 : 3;
      setCredits(Math.max(0, max - used));
    } catch (err) {
      console.error("Failed to fetch usage:", err);
      if (!user) {
        const stored = localStorage.getItem("free-credits");
        if (stored) setCredits(parseInt(stored));
        else localStorage.setItem("free-credits", MAX_FREE_CREDITS.toString());
      }
    }
  };

  useEffect(() => {
    if (user !== undefined) fetchUsage();
  }, [user]);

  const handleSubmit = async () => {
    if (!studentFile || !schemeFile) return;
    if (!user && (credits === null || credits <= 0)) {
      toast({
        title: "Login Required",
        description: "You've used your 3 free credits. Please login to continue.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("student", studentFile);
    form.append("scheme", schemeFile);

    try {
      const headers: any = {};
      if (user) {
        const token = await getIdToken(auth.currentUser!);
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("https://ai-examiner-79zf.onrender.com/mark", {
        method: "POST",
        body: form,
        headers,
      });

      const data = await res.json();
      setResult(data);

      //Re-fetch updated credits from backend
      await fetchUsage();

    }catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong while marking the paper.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExampleFileLoad = async (type: "student" | "scheme") => {
    const url = type === "student" ? "/example-student-paper.pdf" : "/example-mark-scheme.pdf";
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `${type}-example.pdf`, { type: "application/pdf" });
      type === "student" ? setStudentFile(file) : setSchemeFile(file);
      toast({
        title: "Example Loaded",
        description: `${type === "student" ? "Student" : "Mark Scheme"} example loaded.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Load Failed",
        description: "Could not load the example PDF.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderFileInput = (
    label: string,
    file: File | null,
    onChange: (f: File | null) => void,
    type: "student" | "scheme"
  ) => (
    <Box
      border="2px dashed"
      borderColor="#CBD5E0"
      p={5}
      mt={3}
      borderRadius="lg"
      textAlign="center"
      bg="whiteAlpha.300"
      backdropFilter="blur(10px)"
      cursor="pointer"
      as="label"
      _hover={{ bg: "gray.50", borderColor: "gray.400" }}
      transition="0.2s"
    >

      <VStack spacing={2}>
        <Icon as={file ? FaFilePdfIcon : FaUploadIcon} boxSize={6} color={file ? "red.500" : "gray.500"} />
        <Text fontSize="sm" color="gray.700">
          {file ? file.name : `Upload ${label} (PDF)`}
        </Text>
        <Input
          type="file"
          accept=".pdf"
          display="none"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
        <Tooltip label={`Load ${label} Example`} hasArrow isDisabled={!!file}>
          <Box>
            {!file && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="gray"
                onClick={(e) => {
                  e.preventDefault();
                  handleExampleFileLoad(type);
                }}
                leftIcon={<FaFileAltIcon />}
              >
                Test Example PDF
              </Button>
            )}
          </Box>
        </Tooltip>

        {/* PDF Preview */}
        {file && (
          <PDFPreview file={file} />
        )}

      </VStack>
    </Box>
  );

  return (
    <Box
      minH="110vh"
      display="flex"
      flexDirection="column"
      px={6}
      py={4}
      bgImage="linear-gradient(rgba(0,0,0,0) 27px, rgba(0,0,0,0.04) 28px), linear-gradient(90deg, rgba(0,0,0,0) 27px, rgba(0,0,0,0.02) 28px), url('/background.jpg')"
      bgSize="28px 28px, 28px 28px, cover"
      bgPosition="top left, top left, center"
      bgRepeat="repeat, repeat, no-repeat"
    >
      <Box flex="1" minH="90vh" display="flex" flexDirection="column" justifyContent="flex-start">
        <Box textAlign="center" mt={{ base: 20, md: 165 }} mb={4}>
          <Heading
            fontSize={["4xl", "5xl", "5xl"]} // mobile, tablet, desktop
            fontWeight="bold"
            fontFamily="Inter, sans-serif"
            display="inline-flex"
            alignItems="center"
            gap={2}
          >
            ExaminerAI <Icon as={TbChecklistIcon} boxSize={[10, 11, 12]} ml={-1} />
          </Heading>

          <Text
            fontSize={["md", "lg", "lg"]}
            color="gray.600"
            mt={2}
            px={4}
          >
            Mark any paper, powered by examiner-trained AI.
          </Text>
        </Box>

        <Box
          position={{ base: "absolute", md: "fixed" }}
          top={4}
          right={6}
          textAlign="right"
          zIndex={30}
        >
          {user === undefined ? null : user ? (
            <>
              <Button
                leftIcon={<FaHistoryIcon />}
                colorScheme="green"
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/dashboard"}
                mb={1}
                mr={3}
              >
                View History
              </Button>
              <Button size="sm" leftIcon={<FaSignOutIcon />} onClick={logout}>
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Button as="a" href="/auth" size="sm" colorScheme="green" variant="outline" mb={1}>
                Login / Sign Up
              </Button>
              <Text fontSize="xs" color="gray.500">
                login for 10 free credits per month
              </Text>
            </>
          )}
        </Box>

        <Box
          w="full"
          maxW="800px"
          mx="auto"
          bg="white"
          bgGradient="linear(to-b, whiteAlpha.900, whiteAlpha.700)"
          border="1px solid #EDF2F7"
          p={15}
          borderRadius="2xl"
          boxShadow="lg"
          backdropFilter="blur(8px)"
          textAlign="center"
        >

          <Box display="flex" justifyContent="flex-end" mb={2}>
            {credits === null ? (
              <Spinner size="xs" color="green.700" />
            ) : (
              <Badge
                bg="green.50"
                color="green.700"
                fontSize="sm"
                fontWeight="medium"
                px={3}
                py={1}
                borderRadius="full"
                boxShadow="base"
              >
                {`${credits} credits remaining`}
              </Badge>
            )}
          </Box>
          {user && (
            <Text fontSize="xs" color="gray.500" textAlign="right" mb={2}>
              Purchase more credits coming soon
            </Text>
          )}

          <HStack spacing={4} justifyContent="center" flexWrap="wrap">
            {renderFileInput("Student Paper", studentFile, setStudentFile, "student")}
            {renderFileInput("Mark Scheme", schemeFile, setSchemeFile, "scheme")}
            <Button
              colorScheme="green"
              size="lg"
              onClick={handleSubmit}
              isDisabled={!studentFile || !schemeFile || loading}
              w="full"
              _hover={{ bg: "green.500" }}
              _active={{ transform: "scale(0.98)", bg: "green.600" }}
              transition="all 0.2s"
            >
              {loading ? "Marking..." : "Mark Paper"}
            </Button>

          </HStack>

          {result && (
            <VStack spacing={6} align="stretch" mt={10}>
              <Heading size="md" textAlign="left" mb={2}>
                Marking Breakdown
                {!user && (
                  <Text as="span" fontSize="sm" color="orange.500" ml={3} fontWeight="semibold">
                    Login to save your marked exam!
                  </Text>
                )}
              </Heading>
              {result.questions.map((q, i) => (
                <Box
                  key={i}
                  bg="white"
                  borderRadius="xl"
                  boxShadow="lg"
                  border="1px solid #E2E8F0"
                  p={6}
                  textAlign="left"
                >
                  <Text fontWeight="bold" fontSize="lg" mb={1}>
                    Question {q.questionNumber} — <Badge>{q.mark}</Badge>
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    <strong>Question:</strong> {q.question}
                  </Text>
                  <Box mb={3}>
                    <Text fontWeight="semibold" mb={1}>Student Answer:</Text>
                    <Text whiteSpace="pre-line" color="gray.800">{q.studentAnswer.trim()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" mb={1}>Examiner Comment:</Text>
                    <Text whiteSpace="pre-line" color="gray.700">{q.comment}</Text>
                  </Box>
                </Box>
              ))}
              <Box textAlign="center" fontWeight="bold" fontSize="lg" py={3} borderTop="1px solid #E2E8F0">
                Total Marks Awarded: {result.total}
              </Box>
            </VStack>
          )}
        </Box>
      </Box>

      <Box
        as="footer"
        w="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={2}
        py={3}
        bg="transparent"
        boxShadow="none"
        zIndex={20}
        fontFamily="Inter, sans-serif"
      >
        <img
          src="/hamza_profile.png"
          alt="Hamza profile"
          style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid black', objectFit: 'cover', marginRight: 12 }}
        />
        <Text fontSize={{ base: 'sm', md: 'md' }} color="black" fontWeight="medium">
          Built by{' '}
          <a
            href="https://www.linkedin.com/in/hamza-rashid-354257174/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', fontWeight: 'bold', color: 'inherit' }}
          >
            Hamza
          </a>
          {" — giving students examiners' eyes and AI precision. "}
          <span role="img" aria-label="robot">🤖</span>{' '}
          <a
            href="https://github.com/hamza-rashid/ai-examiner"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', fontWeight: 'bold', color: 'inherit' }}
          >
            View on GitHub
          </a>
        </Text>
      </Box>
    </Box>
  );
}

export default App;