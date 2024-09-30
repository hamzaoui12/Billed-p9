/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => ({
  bills: () => ({
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  }),
}));

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@tld.com",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
  });

  describe("When I am on NewBill Page", () => {
    test("Then NewBill form should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
    });

    test("Then handleChangeFile should be called when I upload a file", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const fileInput = screen.getByTestId("file");
      const file = new File(["test"], "test.png", { type: "image/png" });

      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(handleChangeFile).toHaveBeenCalled();
    });

    test("Then handleSubmit should be called when I submit the form", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    });

    test("Integration test: Posting a new bill", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const createSpy = jest.spyOn(mockStore.bills(), "create");

      const form = screen.getByTestId("form-new-bill");

      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transports" },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Vol Paris-Londres" },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2021-12-10" },
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "348" },
      });
      fireEvent.change(screen.getByTestId("vat"), {
        target: { value: "70" },
      });
      fireEvent.change(screen.getByTestId("pct"), {
        target: { value: "20" },
      });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: "Business trip" },
      });

      const file = new File(["test"], "test.png", { type: "image/png" });
      fireEvent.change(screen.getByTestId("file"), {
        target: { files: [file] },
      });

      fireEvent.submit(form);

      await waitFor(() =>
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"])
      );

      expect(createSpy).toHaveBeenCalled();
    });
  });
});
