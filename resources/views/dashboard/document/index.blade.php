@extends('layouts.dashboard')

@section('title')
    Все документы
@endsection

@section('content')
    <h3><a href="{{ route('create_document') }}">Добавить новый документ</a></h3>
    <h1>Список документов</h1>
    <table class="table">
        <thead>
            <th>№</th>
            <th>Заголовок</th>
            <th>Посмотреть</th>
            <th>Редактировать</th>
            <th>Удалить</th>
        </thead>
        <tbody>
        <?php $i = 1 ?>
            @foreach($documents as $document)
                <tr>
                    <td>{{ $i++ }}</td>
                    <td>{{ $document->title }}</td>
                    <td><a href="{{ asset('documents/' . $document->path) }}">Просмотр</a></td>
                    <td><a href="{{ route('edit_document', $document->id) }}">Редактировать</a></td>
                    <td><a href="{{ route('delete_document', $document->id) }}">Удалить</a></td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection