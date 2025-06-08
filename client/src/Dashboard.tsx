import { useState, useEffect } from "react";
import {
  Box, VStack, Heading, Text, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Button, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, useDisclosure, useToast, Spinner
} from "@chakra-ui/react";
import { useUser } from "./AuthContext";
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

type ExamResult = {
  id: string;
  timestamp: { seconds: number; nanoseconds: number };
  result: {
    questions: Array<{
      questionNumber: string;
      question: string;
      maxMarks: string;
      studentAnswer: string;
      mark: string;
      comment: string;
    }>;
    total: string;
  };
  studentFileName: string;
  schemeFileName: string;
};

function Dashboard() {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const user = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === undefined || !user) return;
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch("https://ai-examiner-79zf.onrender.com/exams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch exams");
      const data = await res.json();
      setExams(data);
    } catch {
      setError("Something went wrong loading your results.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (typeof timestamp?.seconds === "number") {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
  };

  const viewExamDetails = (exam: ExamResult) => {
    setSelectedExam(exam);
    onOpen();
  };

  if (!user) {
    return (
      <Box textAlign="center" py={20} bgImage="url('/background.jpg')" bgSize="cover">
        <Heading size="lg">Please log in to view your results</Heading>
        <Button mt={4} colorScheme="green" onClick={() => window.location.href = "/auth"}>
          Log In
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bgImage="url('/background.jpg')" bgSize="cover">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" py={12} px={4}>
      <Box maxW="1100px" mx="auto" bg="white" boxShadow="xl" rounded="2xl" p={[4, 8]}>
        <Heading fontSize="2xl" fontWeight="extrabold" mb={6} color="gray.800">
          📄 Your Marked Papers
        </Heading>

        {error && (
          <VStack spacing={3}>
            <Text color="red.500">{error}</Text>
            <Button colorScheme="green" onClick={fetchExams}>Retry</Button>
          </VStack>
        )}

        {exams.length === 0 ? (
          <VStack spacing={3} py={10}>
            <Text fontSize="lg" color="gray.600">No papers marked yet.</Text>
            <Text fontSize="sm" color="gray.400">Upload a paper to get started.</Text>
          </VStack>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" size="md">
              <Thead>
                <Tr bg="gray.50">
                  <Th fontWeight="bold">Date</Th>
                  <Th fontWeight="bold">Student Paper</Th>
                  <Th fontWeight="bold">Scheme</Th>
                  <Th fontWeight="bold">Score</Th>
                  <Th fontWeight="bold">Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {exams.map((exam) => (
                  <Tr key={exam.id} _hover={{ bg: "green.50" }}>
                    <Td>{formatDate(exam.timestamp)}</Td>
                    <Td>{exam.studentFileName}</Td>
                    <Td>{exam.schemeFileName}</Td>
                    <Td>
                      <Badge colorScheme="green" fontSize="md" px={2} py={1} borderRadius="lg">
                        {exam.result.total}
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="green"
                        variant="solid"
                        onClick={() => navigate(`/exam/${exam.id}`)}
                      >
                        View
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
        <ModalOverlay />
        <ModalContent rounded="2xl" overflow="hidden">
          <ModalHeader bg="green.100" color="green.800" fontWeight="bold" fontSize="xl">
            Breakdown of Results
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody bg="gray.50" px={6} py={4}>
            {selectedExam?.result.questions.map((q, i) => (
              <Box key={i} p={4} bg="white" rounded="lg" shadow="md" mb={4}>
                <Text fontWeight="bold" color="green.700" mb={2}>
                  Question {q.questionNumber} <Badge colorScheme="green">{q.mark}/{q.maxMarks}</Badge>
                </Text>
                <Text fontSize="sm" mb={1}><strong>Q:</strong> {q.question}</Text>
                <Text fontSize="sm" mb={1} color="gray.700"><strong>Answer:</strong> {q.studentAnswer}</Text>
                <Text fontSize="sm" color="gray.600"><strong>Comment:</strong> {q.comment}</Text>
              </Box>
            ))}
            <Box textAlign="center" mt={6}>
              <Text fontWeight="bold" fontSize="lg" color="green.600">
                Total: {selectedExam?.result.total}
              </Text>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Dashboard;
