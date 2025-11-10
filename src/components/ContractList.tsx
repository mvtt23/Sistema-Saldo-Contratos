<SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="expired">Vencido</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
            </SelectContent>
          </Select>

          <Select value={modalityFilter} onValueChange={setModalityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Modalidades</SelectItem>
              {uniqueModalities.map(modality => (
                <SelectItem key={modality} value={modality}>
                  {modalityLabels[modality as keyof typeof modalityLabels]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Unidade Gestora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Unidades</SelectItem>
              {uniqueUnits.map(unit => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Filtro de Data de Vigência - Layout responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="startDateFilter" className="text-sm font-medium text-gray-700 mb-2 block">
              Data de Vigência - Início
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="startDateFilter"
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="endDateFilter" className="text-sm font-medium text-gray-700 mb-2 block">
              Data de Vigência - Fim
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="endDateFilter"
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Mostrando {filteredContracts.length} de {contracts.length} contratos
        </p>
      </div>

      {/* Lista de contratos - Layout responsivo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContracts.map(contract => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onClick={onContractSelect}
          />
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum contrato encontrado</p>
          <p className="text-gray-400 text-sm mt-2">
            Tente ajustar os filtros de busca
          </p>
        </div>
      )}
    </div>
  );
}