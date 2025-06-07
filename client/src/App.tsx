import { useState } from "react";
import {
  ChakraProvider,
  Box,
  Button,
  Text,
  Heading,
  VStack,
  Icon,
  useToast,
  Input,
  Tooltip,
  extendTheme,
  Badge,
} from "@chakra-ui/react";
import { FaFilePdf, FaUpload, FaFileAlt } from "react-icons/fa";

const FaUploadIcon = FaUpload as unknown as React.ElementType;
const FaFilePdfIcon = FaFilePdf as unknown as React.ElementType;
const FaFileAltIcon = FaFileAlt as unknown as React.ElementType;

type MarkedQuestion = {
  questionNumber: string;
  question: string;
  maxMarks: string;
  studentAnswer: string;
  mark: string;
  comment: string;
};

const theme = extendTheme({
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
});

function App() {
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [schemeFile, setSchemeFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ questions: MarkedQuestion[]; total: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!studentFile || !schemeFile) return;

    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append("student", studentFile);
    form.append("scheme", schemeFile);

    try {
      const res = await fetch("http://localhost:8000/mark", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
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
    const url =
      type === "student"
        ? "/example-student-paper.pdf"
        : "/example-mark-scheme.pdf";

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], `${type}-example.pdf`, {
        type: "application/pdf",
      });

      if (type === "student") setStudentFile(file);
      if (type === "scheme") setSchemeFile(file);

      toast({
        title: "Example Loaded",
        description: `${type === "student" ? "Student" : "Mark Scheme"} example loaded.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
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
      _hover={{ bg: "whiteAlpha.200" }}
      bg="whiteAlpha.300"
      backdropFilter="blur(10px)"
      cursor="pointer"
      as="label"
      transition="0.2s"
    >
      <VStack spacing={2}>
        <Icon
          as={file ? FaFilePdfIcon : FaUploadIcon}
          boxSize={6}
          color={file ? "red.500" : "gray.500"}
        />
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
              e.preventDefault(); // prevent label click
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
      <Box
        bgImage="url('/background.jpg')"
        bgSize="cover"
        bgPosition="center"
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        py={10}
      >
        <Box
          w="full"
          maxW="800px"
          textAlign="center"
          bg="rgba(255,255,255,0.85)"
          p={8}
          borderRadius="2xl"
          boxShadow="2xl"
          backdropFilter="blur(12px)"
        >
          <Heading size="2xl" mb={2}>
            AI GCSE Paper Marker
          </Heading>
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
              <Heading size="lg" textAlign="left" mb={2}>
                Marking Breakdown
              </Heading>
              <Text color="gray.600" fontSize="sm" mb={4}>
                Here's how the student performed, based on official mark scheme criteria:
              </Text>

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
                    Question {q.questionNumber} —{" "}
                    <Badge colorScheme="gray" fontSize="0.9em">
                      {q.mark}
                    </Badge>
                  </Text>

                  <Text fontSize="sm" color="gray.600" mb={2}>
                    <strong>Question:</strong> {q.question}
                  </Text>

                  <Box mb={3}>
                    <Text fontWeight="semibold" mb={1}>Student Answer:</Text>
                    <Text whiteSpace="pre-line" color="gray.800">
                      {q.studentAnswer.trim()}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontWeight="semibold" mb={1}>Examiner Comment:</Text>
                    <Text whiteSpace="pre-line" color="gray.700">
                      {q.comment}
                    </Text>
                  </Box>
                </Box>
              ))}

              <Box
                textAlign="center"
                fontWeight="bold"
                fontSize="lg"
                py={3}
                borderTop="1px solid #E2E8F0"
              >
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
