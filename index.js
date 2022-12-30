import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const fetcher = (url) => {
  const get = (key) => fetch(key).then((r) => r.json());
  return Array.isArray(url)
    ? Promise.all(url.map(get)).then((r) => r)
    : get(url);
};

const formatList = (data) => {
  const categories =
    data.filters
      ?.find(({ id }) => id === "category")
      ?.values[0].path_from_root.map((path) => path.name) || [];

  const items =
    data.results?.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.title,
      price: {
        currency: item.currency_id,
        amount: item.installments.amount,
        decimals: item.price,
      },
      picture: item.thumbnail,
      condition: item.condition,
      free_shipping: item.shipping.free_shipping,
    })) || [];

  return {
    author: {
      name: "Facundo",
      lastname: "Arenas",
    },
    categories,
    items,
  };
};

const formatItem = (item) => {
  return {
    author: {
      name: "Facundo",
      lastname: "Arenas",
    },
    item: {
      id: item.id,
      title: item.title,
      price: {
        currency: item.currency_id,
        amount: item.available_quantity,
        decimals: item.price,
      },
      picture: item.pictures[0].url,
      condition: item.attributes.find(
        (attribute) => attribute.id === "ITEM_CONDITION"
      ).value_name,
      free_shipping: item.shipping.free_shipping,
      sold_quantity: item.sold_quantity,
      description: item.plain_text,
    },
  };
};

const formatCategories = (categories) =>
  categories.map((category) => category.name);

app.get("/api/items", async (req, res) => {
  const query = req.query.q?.toLowerCase() || "";
  const data = await fetcher(
    `https://api.mercadolibre.com/sites/MLA/search?q=${query}`
  );
  const results = formatList(data);
  res.send(results);
});

app.get("/api/items/:id", async (req, res) => {
  const id = req.params.id || "";
  const data = await fetcher([
    `https://api.mercadolibre.com/items/${id}`,
    `https://api.mercadolibre.com/items/${id}/description`,
  ]);
  const item = formatItem({ ...data[0], ...data[1] });
  res.send(item);
});

app.get("/api/categories/:id", async (req, res) => {
  const id = req.params.id || "";
  const item = await fetcher(`https://api.mercadolibre.com/items/${id}`);
  const categoriesApi = await fetcher(
    `https://api.mercadolibre.com/categories/${item?.category_id}`
  );
  const categories = categoriesApi?.path_from_root || [];
  const results = formatCategories(categories);
  res.send(results);
});

app.get("/api/address/:query", async (req, res) => {
  const query = req.params.query || "";
  const data = await fetcher(
    `https://api.mercadolibre.com/sites/MLA/search?q=${query}`
  );
  const results =
    data?.results.map((result) => result?.address.state_name) || [];
  res.send(results);
});

app.listen(8080, () => console.log("Listening on port http://localhost:8080"));
