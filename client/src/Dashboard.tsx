import { useState, useEffect } from "react";
import {
  Box, VStack, Heading, Text, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Button, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, Spinner, useToast, Icon, HStack
} from "@chakra-ui/react";
import { FaFileAlt, FaRegCalendarAlt, FaFilePdf, FaClipboardCheck } from "react-icons/fa";
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

  const FaFileAltIcon = FaFileAlt as any;
  const FaCalendarIcon = FaRegCalendarAlt as any;
  const FaPdfIcon = FaFilePdf as any;
  const FaCheckIcon = FaClipboardCheck as any;

  useEffect(() => {
    if (user !== undefined && user) fetchExams();
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
      setError("Something went wrong. Try again later.");
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
      <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" alignItems="center" justifyContent="center">
        <Heading size="lg">Please log in to view your marked papers</Heading>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" py={12} px={4}>
      <Box
        maxW="1200px"
        mx="auto"
        bg="rgba(255,255,255,0.85)"
        borderRadius="2xl"
        p={[6, 10]}
        boxShadow="2xl"
        backdropFilter="blur(12px)"
      >
        <Heading fontSize={["2xl", "3xl"]} fontWeight="extrabold" mb={8} display="flex" alignItems="center" gap={3} color="gray.800">
          <Icon as={FaFileAltIcon} boxSize={7} color="green.500" /> Your Marked Papers
        </Heading>

        {error && (
          <VStack spacing={3} mb={6}>
            <Text color="red.500">{error}</Text>
            <Button colorScheme="green" onClick={fetchExams}>Retry</Button>
          </VStack>
        )}

        {loading ? (
          <Box minH="300px" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="xl" color="green.500" thickness="4px" />
          </Box>
        ) : exams.length === 0 ? (
          <VStack spacing={4} py={16}>
            <Icon as={FaFileAltIcon} boxSize={14} color="gray.300" />
            <Text fontSize="xl" color="gray.600" fontWeight="semibold">No marked papers yet.</Text>
            <Text fontSize="md" color="gray.400">Go back and mark your first paper!</Text>
          </VStack>
        ) : (
          <Box w="full">
            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }}
              gap={7}
            >
              {exams.map((exam) => (
                <Box
                  key={exam.id}
                  bg="white"
                  borderRadius="xl"
                  boxShadow="lg"
                  border="1px solid #E2E8F0"
                  p={6}
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  minH="220px"
                  transition="box-shadow 0.2s"
                  _hover={{ boxShadow: "2xl", borderColor: "green.200" }}
                >
                  <HStack spacing={3} mb={2} color="gray.500">
                    <Icon as={FaCalendarIcon} />
                    <Text fontSize="sm">{formatDate(exam.timestamp)}</Text>
                  </HStack>
                  <VStack align="start" spacing={1} mb={3}>
                    <HStack>
                      <Icon as={FaPdfIcon} color="green.400" />
                      <Text fontSize="md" fontWeight="medium" color="gray.700">{exam.studentFileName}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaCheckIcon} color="green.400" />
                      <Text fontSize="md" color="gray.600">{exam.schemeFileName}</Text>
                    </HStack>
                  </VStack>
                  <HStack justifyContent="space-between" mt={2}>
                    <Badge colorScheme="green" px={3} py={1} borderRadius="lg" fontSize="md" fontWeight="bold">
                      {exam.result.total}
                    </Badge>
                    <Button
                      size="sm"
                      colorScheme="green"
                      variant="solid"
                      fontWeight="semibold"
                      onClick={() => navigate(`/exam/${exam.id}`)}
                    >
                      View
                    </Button>
                  </HStack>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader bg="green.100" color="green.700" fontWeight="bold">
            Breakdown of Results
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody bg="gray.50" px={6} py={4}>
            {selectedExam?.result.questions.map((q, i) => (
              <Box key={i} bg="white" p={4} borderRadius="lg" shadow="md" mb={4}>
                <Text fontWeight="bold" color="green.700">
                  Question {q.questionNumber} <Badge colorScheme="green">{q.mark}/{q.maxMarks}</Badge>
                </Text>
                <Text mt={2} fontSize="sm"><strong>Q:</strong> {q.question}</Text>
                <Text mt={1} fontSize="sm" color="gray.700"><strong>Answer:</strong> {q.studentAnswer}</Text>
                <Text mt={1} fontSize="sm" color="gray.600"><strong>Comment:</strong> {q.comment}</Text>
              </Box>
            ))}
            <Box textAlign="center" mt={4} fontWeight="bold" fontSize="lg" color="green.700">
              Total Score: {selectedExam?.result.total}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Dashboard;
