import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";

import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const { data } = api.posts.getById.useQuery({
    id,
  });

  // No loading state needed after using the createProxySSGHelpers
  // if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>404 Error</div>;

  console.log(data);

  return (
    <>
      <Head>
        <title>{`${data.post.content} - ${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} key={data.post.id} />
      </PageLayout>
    </>
  );
};

// GetStaticProps is a convenient function from NextJs when we don't know the type of context
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("No slug");

  // Allows us to fetch data ahead of time and hydrate it to the page
  await ssg.posts.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
