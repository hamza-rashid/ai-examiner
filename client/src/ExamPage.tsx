import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  VStack,
  Badge,
  Spinner,
  Button,
  HStack,
  useToast
} from "@chakra-ui/react";
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";
import { useUser } from "./AuthContext";

function formatDate(timestamp: any) {
  if (!timestamp) return "Unknown date";
  if (typeof timestamp === "object" && typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }
  if (typeof timestamp === "string") {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d.toLocaleString();
    return timestamp;
  }
  return "Unknown date";
}

const ExamPage = () => {
  const { id } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const user = useUser();

  useEffect(() => {
    if (user === undefined) return; // Wait for auth
    if (!user) return;
    fetchExam();
    // eslint-disable-next-line
  }, [id, user]);

  const fetchExam = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch(`https://ai-examiner-79zf.onrender.com/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch exam");
      const data = await res.json();
      const found = data.find((e: any) => e.id === id);
      setExam(found);
    } catch (err) {
      setError("Failed to load exam. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text fontSize="lg" color="red.500">{error}</Text>
          <Button colorScheme="green" onClick={fetchExam}>Retry</Button>
        </VStack>
      </Box>
    );
  }

  if (!exam) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text fontSize="lg" color="gray.500">Exam not found.</Text>
          <Button colorScheme="green" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" px={2} py={10}>
      <Box maxW="900px" mx="auto" bg="white" borderRadius="2xl" boxShadow="2xl" p={[4, 8]}>
        <HStack justifyContent="space-between" mb={6}>
          <Heading size="lg" color="green.700" fontWeight="extrabold">Exam Marking Breakdown</Heading>
          <Button variant="outline" colorScheme="green" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </HStack>
        <Text color="gray.500" mb={2}>
          <strong>Date:</strong> {formatDate(exam.timestamp)}
        </Text>
        <Text color="gray.500" mb={2}>
          <strong>Student Paper:</strong> {exam.studentFileName}
        </Text>
        <Text color="gray.500" mb={6}>
          <strong>Scheme:</strong> {exam.schemeFileName}
        </Text>
        <VStack spacing={6} align="stretch">
          {exam.result.questions.map((q: any, index: number) => (
            <Box key={index} p={5} bg="gray.50" borderRadius="xl" boxShadow="md" border="1px solid #E2E8F0">
              <Text fontWeight="bold" fontSize="lg" mb={1} color="green.700">
                Question {q.questionNumber} <Badge colorScheme="green">{q.mark}/{q.maxMarks}</Badge>
              </Text>
              <Text fontSize="md" color="gray.700" mb={2}>
                <strong>Question:</strong> {q.question}
              </Text>
              <Box mb={3}>
                <Text fontWeight="semibold" mb={1} color="gray.600">Student Answer:</Text>
                <Text whiteSpace="pre-line" color="gray.800">{q.studentAnswer.trim()}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" mb={1} color="gray.600">Examiner Comment:</Text>
                <Text whiteSpace="pre-line" color="gray.700">{q.comment}</Text>
              </Box>
            </Box>
          ))}
          <Box p={4} borderWidth={1} borderRadius="md" bg="green.50" textAlign="center">
            <Text fontWeight="bold" color="green.700" fontSize="lg">Total Score: {exam.result.total}</Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default ExamPage; 