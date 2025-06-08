import { useState, useEffect } from "react";
import {
  ChakraProvider, Box, Button, Text, Heading, VStack, Icon,
  useToast, Input, Tooltip, extendTheme, Badge, HStack
} from "@chakra-ui/react";
import { FaFilePdf, FaUpload, FaFileAlt, FaSignOutAlt } from "react-icons/fa";
import { useUser } from "./AuthContext";
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";
import { logout } from "./authHelpers";

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
  const [credits, setCredits] = useState<number>(MAX_FREE_CREDITS);
  const toast = useToast();
  const user = useUser();

  useEffect(() => {
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

    fetchUsage();
  }, [user]);

  const decrementCredit = () => {
    if (!user) {
      const newCredits = credits - 1;
      setCredits(newCredits);
      localStorage.setItem("free-credits", newCredits.toString());
    }
  };

  const handleSubmit = async () => {
    if (!studentFile || !schemeFile) return;
    if (!user && credits <= 0) {
      toast({
        title: "Login Required",
        description: "You’ve used your 3 free marks. Please login to continue.",
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
      if (!user) decrementCredit();
      else setCredits((prev) => Math.max(0, prev - 1));
      setResult(data);
    } catch (err) {
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
      border="2px dashed #CBD5E0"
      p={4}
      borderRadius="lg"
      textAlign="center"
      bg="whiteAlpha.300"
      backdropFilter="blur(10px)"
      cursor="pointer"
      as="label"
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
        <Tooltip label={`Load ${label} Example`} hasArrow>
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
        </Tooltip>
      </VStack>
    </Box>
  );

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" px={6} py={4}>
        <HStack justifyContent="flex-end" mb={4}>
          {user ? (
            <Button size="sm" leftIcon={<FaSignOutIcon />} onClick={logout}>
              Log Out
            </Button>
          ) : (
            <Box textAlign="right">
              <Button as="a" href="/auth" size="sm" colorScheme="green" variant="outline" mb={1}>
                Login / Sign Up
              </Button>
              <Text fontSize="xs" color="gray.500">
                login for 10 free credits per month
              </Text>
            </Box>
          )}
        </HStack>

        <Box
          w="full"
          maxW="800px"
          mx="auto"
          bg="rgba(255,255,255,0.85)"
          p={8}
          borderRadius="2xl"
          boxShadow="2xl"
          backdropFilter="blur(12px)"
          textAlign="center"
        >
          <Box display="flex" justifyContent="flex-end" mb={2}>
          <Badge
            bg="#e6f7ec"
            color="#2f855a"
            fontSize="sm"
            fontWeight="medium"
            px={3}
            py={1}
            borderRadius="full"
            boxShadow="sm"
          >
            {credits} credits remaining
          </Badge>
          </Box>

          <Heading size="lg" mb={2}>AI GCSE Paper Marker</Heading>
          <Text mb={6} color="gray.700" fontSize="md">
            Upload a student’s paper and a mark scheme – we’ll mark it using examiner-level accuracy.
          </Text>

          <VStack spacing={4}>
            {renderFileInput("Student Paper", studentFile, setStudentFile, "student")}
            {renderFileInput("Mark Scheme", schemeFile, setSchemeFile, "scheme")}
            <Button
              colorScheme="green"
              size="lg"
              onClick={handleSubmit}
              isDisabled={!studentFile || !schemeFile || loading}
              w="full"
            >
              {loading ? "Marking..." : "Mark Paper"}
            </Button>
          </VStack>

          {result && (
            <VStack spacing={6} align="stretch" mt={10}>
              <Heading size="md" textAlign="left" mb={2}>
                Marking Breakdown
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
    </ChakraProvider>
  );
}

export default App;
